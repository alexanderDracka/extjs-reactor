'use strict';

import fs from 'fs';
import path from 'path';
import { sync as mkdirp } from 'mkdirp';
import extractFromJSX from './extractFromJSX';
import { sync as rimraf } from 'rimraf';
import { buildXML, createAppJson, createWorkspaceJson } from './artifacts';
import { execSync, spawn, fork } from 'child_process';
import { generate } from 'astring';
import { sync as resolve } from 'resolve';

let watching = false;

/**
 * Produces a minimal build of ExtReact by crawling your React source code and extracting the xtypes used
 * in JSX tags
 */
module.exports = class ReactExtJSWebpackPlugin {

    /**
     * @param {Object[]} builds
     * @param {Boolean} [debug=false] Set to true to prevent cleanup of build temporary build artifacts that might be helpful in troubleshooting issues.
     * @param {String} sdk The full path to the ExtReact SDK
     * @param {String} [toolkit='modern'] "modern" or "classic"
     * @param {String} theme The name of the ExtReact theme package to use, for example "theme-material"
     * @param {String[]} packages An array of ExtReact packages to include
     * @param {String[]} overrides An array with the paths of directories or files to search. Any classes
     * declared in these locations will be automatically required and included in the build.
     * If any file defines an ExtReact override (using Ext.define with an "override" property),
     * that override will in fact only be included in the build if the target class specified
     * in the "override" property is also included.
     * @param {String} output The path to directory where the ExtReact bundle should be written
     * @param {Boolean} asynchronous Set to true to run Sencha Cmd builds asynchronously. This makes the webpack build finish much faster, but the app may not load correctly in your browser until Sencha Cmd is finished building the ExtReact bundle
     * @param {Boolean} production Set to true for production builds.  This tell Sencha Cmd to compress the generated JS bundle.
     */
    constructor(options) {
        options = { ...this.getDefaultOptions(), ...options };
        const { builds } = options;

        if (Object.keys(builds).length === 0) {
            const { builds, ...buildOptions } = options;
            builds.ext = buildOptions;
        }

        for (let name in builds)
            this._validateBuildConfig(name, builds[name]);

        Object.assign(this, {
            ...options,
            currentFile: null,
            manifest: null,
            dependencies: []
        });
    }

    /**
     * Default config options
     * @protected
     * @return {Object}
     */
    getDefaultOptions() {
        return {
            builds: {},
            debug: false,
            watch: false,
            test: /\.jsx?$/,

            /* begin single build only */
            output: 'ext-react',
            toolkit: 'modern',
            theme: 'theme-triton',
            packages: null,
            packageDirs: [],
            overrides: [],
            asynchronous: false,
            production: false,
            manifestExtractor: extractFromJSX,
            /* end single build only */
        }
    }

    apply(compiler) {

        const me = this;

        /**
         * Adds the code for the specified function call to the manifest.js file
         * @param {Object} call A function call AST node.
         */
        const addToManifest = function(call) {
            try {
                const file = this.state.module.resource;
                me.dependencies[file] = [ ...(me.dependencies[file] || []), generate(call) ];
            } catch (e) {
                console.error(`Error processing ${file}`);
            }
        };

        compiler.plugin('watch-run', (watching, cb) => {
            this.watch = true;
            cb();
        });

        // extract xtypes from JSX tags
        compiler.plugin('compilation', (compilation, data) => {
            compilation.plugin('succeed-module', (module) => {
                this.currentFile = module.resource;

                if (module.resource && module.resource.match(this.test) && !module.resource.match(/node_modules/)) {
                    const doParse = () => {
                        this.dependencies[this.currentFile] = [ 
                            ...(this.dependencies[this.currentFile] || []), 
                            ...this.manifestExtractor(module._source._value, compilation, module)
                        ];
                    };

                    if (this.debug) {
                        doParse();
                    } else {
                        try { doParse(); } catch (e) { console.error('error parsing ' + this.currentFile); }
                    }
                }
            });

            data.normalModuleFactory.plugin("parser", function(parser, options) {
                // extract xtypes and classes from Ext.create calls
                parser.plugin('call Ext.create', addToManifest);

                // copy Ext.require calls to the manifest.  This allows the users to explicitly require a class if the plugin fails to detect it.
                parser.plugin('call Ext.require', addToManifest);

                // copy Ext.define calls to the manifest.  This allows users to write standard ExtReact classes.
                parser.plugin('call Ext.define', addToManifest);
            })
        });

        // once all modules are processed, create the optimized ExtReact build.
        compiler.plugin('emit', (compilation, callback) => {
            const modules = compilation.chunks.reduce((a, b) => a.concat(b.modules), []);
            const build = this.builds[Object.keys(this.builds)[0]];

            let outputPath = path.join(compiler.outputPath, this.output);

            // webpack-dev-server overwrites the outputPath to "/", so we need to prepend contentBase
            if (compiler.outputPath === '/' && compiler.options.devServer) {
                outputPath = path.join(compiler.options.devServer.contentBase, outputPath);
            }

            // the following is needed for html-webpack-plugin to include <script> and <link> tags for ExtReact
            const jsChunk = compilation.addChunk(`${this.output}-js`);

            jsChunk.hasRuntime = jsChunk.isInitial = () => true;
            jsChunk.files.push(path.join(this.output, 'ext.js'));
            jsChunk.files.push(path.join(this.output, 'ext.css'));
            jsChunk.id = -2; // this forces html-webpack-plugin to include ext.js first

            if (this.asynchronous) callback();

            this._buildExtBundle('ext', modules, outputPath, build)
                .then(() => {
                    // const cssVarPath = path.join(this.output, 'css-vars.js');

                    // if (fs.existsSync(path.join(outputPath, 'css-vars.js'))) {
                    //     const cssVarChunk = compilation.addChunk(`${this.output}-css-vars`);
                    //     cssVarChunk.hasRuntime = cssVarChunk.isInitial = () => true;
                    //     cssVarChunk.files.push(cssVarPath);
                    //     cssVarChunk.id = -1;
                    // }

                    !this.asynchronous && callback();
                })
                .catch(e => {
                    console.error(e);
                    compilation.errors.push(new Error('[@extjs/reactor-webpack-plugin]: ' + e.toString()));
                });
        });
    }

    /**
     * Checks each build config for missing/invalid properties
     * @param {String} name The name of the build
     * @param {String} build The build config
     * @private
     */
    _validateBuildConfig(name, build) {
        let { sdk } = build;

        if (!sdk) {
            try {
                build.sdk = path.dirname(resolve('@extjs/ext-react', { basedir: process.cwd() }))
                build.packageDirs = [...(build.packageDirs || []), path.dirname(build.sdk)]; 
                build.packages = build.packages || this._findPackages(build.sdk);
            } catch (e) {
                throw new Error(`@extjs/ext-react not found.  You can install it with "npm install --save @extjs/ext-react" or, if you have a local copy of the SDK, specify the path to it using the "sdk" option in build "${name}."`);
            }
        }
    }

    /**
     * Return the names of all ExtReact packages in the same parent directory as ext-react (typically node_modules/@extjs)
     * @private
     * @param {String} sdk Path to ext-react
     * @return {String[]}
     */
    _findPackages(sdk) {
        const packages = [];
        const modulesDir = path.join(sdk, '..');
        const dirs = fs.readdirSync(modulesDir);

        for (let dir of dirs) {
            const packageJson = path.join(modulesDir, dir, 'package.json');
            
            if (fs.existsSync(packageJson)) {
                const packageInfo = JSON.parse(fs.readFileSync(packageJson));

                if (packageInfo.sencha) {
                    packages.push(packageInfo.sencha.name);
                }
            }
        }

        return packages;
    }

    /**
     * Returns the path to the sencha cmd executable
     * @private
     * @return {String}
     */
    _getSenchCmdPath() {
        try {
            // use @extjs/sencha-cmd from node_modules
            return require('@extjs/sencha-cmd');
        } catch (e) {
            // attempt to use globally installed Sencha Cmd
            return 'sencha';
        }
    }

    /**
     /**
     * Builds a minimal version of the ExtReact framework based on the classes used
     * @param {String} name The name of the build
     * @param {Module[]} modules webpack modules
     * @param {String} output The path to where the framework build should be written
     * @param {String} [toolkit='modern'] "modern" or "classic"
     * @param {String} output The path to the directory to create which will contain the js and css bundles
     * @param {String} theme The name of the ExtReact theme package to use, for example "theme-material"
     * @param {String[]} packages An array of ExtReact packages to include
     * @param {String[]} packageDirs Directories containing packages
     * @param {String[]} overrides An array of locations for overrides
     * @param {String} sdk The full path to the ExtReact SDK
     * @private
     */
    _buildExtBundle(name, modules, output, { toolkit='modern', theme, packages=[], packageDirs=[], sdk, overrides }) {
        let sencha = this._getSenchCmdPath();

        return new Promise((resolve, reject) => {
            this.onBuildComplete = resolve;
            this.onBuildFail = reject;

            if (!watching) {
                rimraf(output);
                mkdirp(output);
            }

            let statements = ['Ext.require(["Ext.app.Application", "Ext.Component", "Ext.Widget"])']; // for some reason command doesn't load component when only panel is required

            for (let module of modules) {
                const deps = this.dependencies[module.resource];
                if (deps) statements = statements.concat(deps);
            }

            const js = statements.join(';\n');
            const manifest = path.join(output, 'manifest.js');

            if (fs.existsSync(path.join(sdk, 'ext'))) {
                // local checkout of the SDK repo
                packageDirs.push(path.join('ext', 'packages'));
                sdk = path.join(sdk, 'ext');
            }

            if (!watching) {
                fs.writeFileSync(path.join(output, 'build.xml'), buildXML({ compress: this.production }), 'utf8');
                fs.writeFileSync(path.join(output, 'app.json'), createAppJson({ theme, packages, toolkit, overrides, packageDirs }), 'utf8');
                fs.writeFileSync(path.join(output, 'workspace.json'), createWorkspaceJson(sdk, packageDirs, output), 'utf8');
            }

            let cmdRebuildNeeded = false;

            if (this.manifest === null || js !== this.manifest) {
                // Only write manifest if it differs from the last run.  This prevents unnecessary cmd rebuilds.
                this.manifest = js;
                fs.writeFileSync(manifest, js, 'utf8');
                cmdRebuildNeeded = true;
                console.log(`\nbuilding ExtReact bundle: ${name} => ${output}`);
            }

            if (this.watch) {
                if (!watching) {
                    watching = fork(sencha, ['ant', 'watch'], { cwd: output, silent: true });
                    watching.stdout.pipe(process.stdout);
                    watching.stdout.on('data', data => {
                        if (data.toString().match(/Waiting for changes\.\.\./)) {
                            this.onBuildComplete(output);
                        }
                    });
                    watching.on('exit', code => this.onBuildFail())
                }

                if (!cmdRebuildNeeded) resolve(output);
            } else {
                execSync(`${sencha} ant build`, { cwd: output, stdio: 'inherit' });
                resolve(output);
            }
        });
    }
};


