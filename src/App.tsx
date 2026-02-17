import { createEffect, createMemo, createSignal, untrack, type JSX } from "solid-js"
import { tokenise, TokenTag } from "./json-parser"

export function App(): JSX.Element {
	let divElement!: HTMLDivElement
	let textareaElement!: HTMLTextAreaElement
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
			return { tokens, error }
		}

		return { tokens, error: undefined }
	})

	const getTokens = createMemo(() => getTokensAndError().tokens)
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
	const errorHighlight = new Highlight

	CSS.highlights
		.set(`squigly-bracket`, squiglyBracketHighlight)
		.set(`square-bracket`, squareBracketHighlight)
		.set(`punctuation`, punctuationHighlight)
		.set(`boolean`, booleanHighlight)
		.set(`number`, numberHighlight)
		.set(`null`, nullHighlight)
		.set(`string`, stringHighlight)
		.set(`error`, errorHighlight)

	const errorRange = new Range

	createEffect(wasError => {
		if (getError()) {
			const textNode = divElement.childNodes[0]

			errorRange.setStart(textNode, getIndexOfEndOfErrorLine() + 1)
			errorRange.setEnd(textNode, getIndexOfEndOfErrorLine() + 1 + getErrorMessage().length)

			if (!wasError)
				errorHighlight.add(errorRange)

			return true
		}

		if (wasError)
			errorHighlight.delete(errorRange)

		return false
	})

	createEffect(() => {
		const tokens = getTokens()

		if (!tokens)
			return

		squiglyBracketHighlight.clear()
		squareBracketHighlight.clear()
		punctuationHighlight.clear()
		booleanHighlight.clear()
		numberHighlight.clear()
		nullHighlight.clear()
		stringHighlight.clear()

		const textNode = divElement.childNodes[0]

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
				: undefined

			if (highlight) {
				const range = new Range

				range.setStart(textNode, token.index)
				range.setEnd(textNode, token.index + token.size)
				highlight.add(range)
			}
		}
	})
	
	return <>
		<div
			ref={divElement}
			style="position: absolute; user-select: none; width: 100vw; height: 100vh; white-space: pre-wrap"
		>{
			getTokens().length && getError()
				? `${getTextAreaValue().slice(0, getIndexOfEndOfErrorLine())} ${getErrorMessage()}${getTextAreaValue().slice(getIndexOfEndOfErrorLine())}`
				: getTextAreaValue()
		}</div>

		<textarea
			ref={textareaElement}
			value={untrack(() => getTextAreaValue())}
			style="width: 100vw; height: 100vh; color: #00000000; caret-color: light-dark(black, white); position: absolute; left: 0; white-space: pre-wrap"
			onKeyDown={event => {
				if (event.key == `Tab`) {
					event.preventDefault()
					document.execCommand(`insertText`, false, `\t`)
				}
			}}
			onInput={() => setTextAreaValue(textareaElement.value)}
		/>
	</>
}
