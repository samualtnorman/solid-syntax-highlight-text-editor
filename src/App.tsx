import { createEffect, createMemo, createSignal, untrack, type JSX } from "solid-js"
import OutwardArrowIcon from "~icons/material-symbols/arrow-outward-rounded"
import DarkModeIcon from "~icons/material-symbols/dark-mode-rounded"
import LightModeIcon from "~icons/material-symbols/light-mode-rounded"
import { tokenise, TokenTag } from "./json-parser"

const spliceString = (string: string, toInsert: string, index: number, length = 0): string =>
	string.slice(0, index) + toInsert + string.slice(index + length)

type Theme = `light` | `dark`

const reverseTheme = (theme: Theme) => theme == `light` ? `dark` : `light`

export function App(): JSX.Element {
	let divElement!: HTMLDivElement

	const [ getTextAreaValue, setTextAreaValue ] = createSignal(`\
[
	null,
	true,
	false,
	123,
	"hello world",
	{ "foo": "bar" }
]`)

	const getTokensAndError = createMemo(() => {
		const tokens = []

		try {
			for (const token of tokenise(getTextAreaValue()))
				tokens.push(token)
		} catch (error) {
			return { tokens, error, isError: true } 
		}

		return { tokens, error: undefined, isError: false }
	})

	const getTokens = createMemo(() => getTokensAndError().tokens)

	const isError = createMemo(() => getTokensAndError().isError)
	const getError = createMemo(() => getTokensAndError().error)

	const getErrorMessage = createMemo(() => {
		const error = getError()
		const message = error instanceof Error ? error.message : String(error)
		const newlineIndex = message.indexOf(`\n`)

		return newlineIndex == -1 ? message : message.slice(0, newlineIndex)
	})

	const getLastToken = createMemo(() => getTokens().at(-1))

	const getLastTokenIndex = createMemo(() => {
		const lastToken = getLastToken()

		return lastToken && lastToken.index + lastToken.size
	})

	const getIndexOfEndOfErrorLine = createMemo(() => {
		const index = getTextAreaValue().indexOf(`\n`, getLastTokenIndex() && getLastTokenIndex()! + 1)

		return index == -1 ? getTextAreaValue().length : index
	})

	const squiglyBracketHighlight = new Highlight
	const squareBracketHighlight = new Highlight
	const punctuationHighlight = new Highlight
	const booleanHighlight = new Highlight
	const numberHighlight = new Highlight
	const nullHighlight = new Highlight
	const stringHighlight = new Highlight
	const keyHighlight = new Highlight

	CSS.highlights
		.set(`squigly-bracket`, squiglyBracketHighlight)
		.set(`square-bracket`, squareBracketHighlight)
		.set(`punctuation`, punctuationHighlight)
		.set(`boolean`, booleanHighlight)
		.set(`number`, numberHighlight)
		.set(`null`, nullHighlight)
		.set(`string`, stringHighlight)
		.set(`key`, keyHighlight)

	createEffect(() => {
		const tokens = getTokens()
		const textNode = divElement.firstChild || undefined

		if (!(tokens.length && textNode))
			return

		squiglyBracketHighlight.clear()
		squareBracketHighlight.clear()
		punctuationHighlight.clear()
		booleanHighlight.clear()
		numberHighlight.clear()
		nullHighlight.clear()
		stringHighlight.clear()
		keyHighlight.clear()

		for (const token of tokens) {
			const highlight =
				token.tag == TokenTag.OpenSquiglyBracket || token.tag == TokenTag.CloseSquiglyBracket ?
					squiglyBracketHighlight
				: token.tag == TokenTag.OpenSquareBracket || token.tag == TokenTag.CloseSquareBracket ?
					squareBracketHighlight
				: token.tag == TokenTag.Colon || token.tag == TokenTag.Comma ?
					punctuationHighlight
				: token.tag == TokenTag.True || token.tag == TokenTag.False ?
					booleanHighlight
				: token.tag == TokenTag.Number ?
					numberHighlight
				: token.tag == TokenTag.Null ?
					nullHighlight
				: token.tag == TokenTag.String ?
					stringHighlight
				: token.tag == TokenTag.Key ?
					keyHighlight
				: undefined

			if (highlight) {
				const range = new Range

				range.setStart(textNode, token.index)
				range.setEnd(textNode, token.index + token.size)
				highlight.add(range)
			}
		}
	})

	const prefersDarkQuery = matchMedia(`(prefers-color-scheme: dark)`)
	const [ getColorScheme, setColorScheme ] = createSignal((localStorage.getItem(`color-scheme`) || ``) as Theme | ``)

	createEffect(() => {
		document.body.style.colorScheme = getColorScheme()
		localStorage.setItem(`color-scheme`, getColorScheme())
	})

	return <>
		<div
			ref={divElement}
			style="user-select: none; white-space: pre-wrap"
		>{getTextAreaValue()}</div>

		{isError() && <div
			style="position: absolute; top: 0; user-select: none; white-space: preserve nowrap; color: var(--red)"
		>{
			spliceString(getTextAreaValue().replace(/\S/g, ` `), `  ${getErrorMessage()}`, getIndexOfEndOfErrorLine())
		}</div>}

		<textarea
			value={untrack(() => getTextAreaValue())}
			style="top: 0; right: 0; bottom: 0; left: 0; color: transparent; caret-color: var(--rosewater); position: absolute; left: 0; white-space: pre-wrap; overflow-y: hidden"
			onKeyDown={event => {
				if (event.key == `Tab`) {
					event.preventDefault()
					document.execCommand(`insertText`, false, `\t`)
				}
			}}
			onInput={({ currentTarget }) => setTextAreaValue(currentTarget.value)}
		/>

		<div style="position: absolute; top: .25em; right: .25em">
			<button onClick={() => {
				const systemTheme = prefersDarkQuery.matches ? `dark` : `light`
				const newTheme = reverseTheme(getColorScheme() || systemTheme)

				setColorScheme(newTheme == systemTheme ? `` : newTheme)
			}}>{getColorScheme() == `light` ? <LightModeIcon/> : <DarkModeIcon/>}</button>
		</div>

		<a
			href="https://github.com/samualtnorman/solid-syntax-highlight-text-editor"
			target="_blank"
			style="position: absolute; bottom: .25em; right: .25em"
		>Source<OutwardArrowIcon width="1em" height="1em"/></a>
	</>
}
