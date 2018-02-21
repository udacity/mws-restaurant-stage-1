// http://eslint.org/docs/user-guide/configuring

module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
	],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
	globals: {
		'process': true,
		'module': true,
	},
	env: {
		browser: true,
	},
	plugins: [
		'html',
		'compat'
	],
	'rules': {
		// allow debugger during development
		'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
		'no-debugger': [
			'warn',
		],
		'brace-style': [
			'warn',
			'1tbs',
			{
				'allowSingleLine': true,
			}
		],
		'comma-spacing': [
			'warn',
			{
				'before': false,
				'after': true,
			}
		],
		'curly': [
			'warn',
			'multi-or-nest',
		],
		'no-multiple-empty-lines': [
			'warn',
			{
				'max': 2,
				'maxBOF': 1,
			}
		],
		'no-inner-declarations': [
			'off',
		],
		'operator-linebreak': [
			'warn',
			'before',
		],
		'block-spacing': [
			'warn',
			'always',
		],
		'dot-location': [
			'warn',
			'property',
		],
		'func-call-spacing': [
			'warn',
			'never',
		],
		'key-spacing': [
			'warn',
			{
				'beforeColon': false,
			}
		],
		'new-cap': [
			'warn',
			{
				'newIsCap': true,
			}
		],
		'no-duplicate-imports': [
			'warn',
			{
				'includeExports': true,
			}
		],
		'no-floating-decimal': 'warn',
		'no-multi-spaces': 'warn',
		'no-return-assign': [
			'off',
			'except-parens',
		],
		'no-undef': 'warn',
		'no-undef-init': 'warn',
		'no-whitespace-before-property': 'warn',
		'object-property-newline': 'off',
		'padded-blocks': [
			'warn',
			{
				'switches': 'never',
				'blocks': 'always',
			}
		],
		'yield-star-spacing': [
			'warn',
			'both',
		],
		'one-var-declaration-per-line': [
			'warn',
			'always',
		],
		'space-infix-ops': 'warn',
		'comma-dangle': 'off',
		'no-extra-semi': 'off',
		'no-console': 'warn',
		'no-mixed-spaces-and-tabs': 'warn',
		'space-before-function-paren': [
			'warn',
			'never',
		],
		'space-before-blocks': 'warn',
		'array-bracket-spacing': [
			'warn',
			'always',
			{
				'singleValue': true,
				'objectsInArrays': false,
				'arraysInArrays': true,
			}
		],
		'computed-property-spacing': [
			'warn',
			'always',
		],
		'space-in-parens': [
			'warn',
			'always',
		],
		'object-curly-spacing': [
			'warn',
			'always',
		],
		'keyword-spacing': [
			'warn',
			{
				'after': false,
				'overrides': {
					'const': {
						'after': true,
					},
					'else': {
						'before': true,
						'after': true,
					},
					'from': {
						'before': true,
						'after': true,
					},
					'return': {
						'after': true,
					},
					'export': {
						'after': true,
					},
					'import': {
						'after': true,
					},
					'case': {
						'after': true,
					},
					'try': {
						'after': true,
					},
					'catch': {
						'before': true,
						'after': false,
					}
				}
			}
		],
		'no-irregular-whitespace': 1,
		'space-unary-ops': [
			1,
			{
				'words': true,
				'nonwords': true,
			}
		],
		'arrow-spacing': [
			1,
			{
				'before': true,
				'after': true,
			}
		],
		'no-unused-vars': [
			1,
			{
				'argsIgnorePattern': 'kendo|iElement',
				'varsIgnorePattern': 'vm|kendo|iElement',
			}
		]
	}
}
