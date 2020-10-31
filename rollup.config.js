import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser';


/////////////////////////////////////////
//  ROLLUP
/////////////////////////////////////////


export default [
    {
        input: 'src/distools/index.js',
        output: {
            format: 'iife',
            file: 'dist/script.gui.js'
        },
        plugins: [
            babel({
                babelrc: false,
                plugins: [
                    [
                        'root-import',
                        {
                            rootPathPrefix: '@/',
                            rootPathSuffix: 'src/distools'
                        }
                    ],
                    [
                        'inline-import',
                        {
                            extensions: ['.css']
                        }
                    ],
                    '@babel/transform-react-jsx'
                ],
                babelHelpers: 'bundled'
            }),
            terser()
        ]
    },
    {
        input: 'src/distools/cmd.js',
        output: {
            format: 'iife',
            file: 'dist/script.js'
        },
        plugins: [
            babel({
                babelrc: false,
                plugins: [
                    [
                        'root-import',
                        {
                            rootPathPrefix: '@/',
                            rootPathSuffix: 'src/distools'
                        }
                    ]
                ],
                babelHelpers: 'bundled'
            }),
            terser()
        ]
    },
    {
        input: 'src/injector/index.js',
        output: {
            format: 'cjs',
            exports: 'auto',
            file: 'dist/injector.js'
        },
        plugins: [
            resolve(),
            commonjs({
                ignore: [
                    'bufferutil',
                    'utf-8-validate',
                    './core.asar'
                ]
            }),
            terser({
                keep_classnames: /BrowserWindow/
            })
        ],
        external: [
            "electron",
            "events",
            "https",
            "http",
            "net",
            "tls",
            "crypto",
            "url",
            "stream",
            "zlib",
            "path"
        ]
    }
]
