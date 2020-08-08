import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser';


/////////////////////////////////////////
//  ROLLUP
/////////////////////////////////////////


export default {
    input: 'src/index.js',
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
                        rootPathSuffix: 'src'
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
}