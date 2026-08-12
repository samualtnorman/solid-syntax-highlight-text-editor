import { createEffect, createMemo, createSignal, untrack, type JSX } from "solid-js"
import { tokenise, TokenTag } from "./json-parser"

const createRange = ({ start, end, highlight }: {
	start: () => { node: Node, offset: number } | undefined
	end: () => { node: Node, offset: number } | undefined
	highlight: () => Highlight | undefined
}) => {
	const range = new Range

	createEffect(() => {
		if (start())
			range.setStart(start()!.node, start()!.offset)
	})

	createEffect(() => {
		if (end())
			range.setEnd(end()!.node, end()!.offset)
	})

	createEffect<Highlight | undefined>(lastHighlight => {
		lastHighlight?.delete(range)
		return highlight()?.add(range)
	})

	return range
}

const spliceString = (string: string, toInsert: string, index: number, length = 0): string =>
	string.slice(0, index) + toInsert + string.slice(index + length)

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
	const errorHighlight = new Highlight
	const keyHighlight = new Highlight

	CSS.highlights
		.set(`squigly-bracket`, squiglyBracketHighlight)
		.set(`square-bracket`, squareBracketHighlight)
		.set(`punctuation`, punctuationHighlight)
		.set(`boolean`, booleanHighlight)
		.set(`number`, numberHighlight)
		.set(`null`, nullHighlight)
		.set(`string`, stringHighlight)
		.set(`error`, errorHighlight)
		.set(`key`, keyHighlight)
	
	createRange({
		start: () => isError() && divElement.firstChild
			? { node: divElement.firstChild!, offset: getIndexOfEndOfErrorLine() + 2 }
			: undefined,
		end: () => isError() && divElement.firstChild
			? { node: divElement.firstChild!, offset: getIndexOfEndOfErrorLine() + 2 + getErrorMessage().length }
			: undefined,
		highlight: () => isError() ? errorHighlight : undefined
	})

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
	
	return <>
		<div
			ref={divElement}
			style="position: absolute; user-select: none; width: 100vw; height: 100vh; white-space: pre-wrap"
		>{
			isError()
				? spliceString(getTextAreaValue(), `  ${getErrorMessage()}`, getIndexOfEndOfErrorLine())
				: getTextAreaValue()
		}</div>

		<textarea
			value={untrack(() => getTextAreaValue())}
			style="width: 100vw; height: 100vh; color: transparent; caret-color: var(--rosewater); position: absolute; left: 0; white-space: pre-wrap"
			onKeyDown={event => {
				if (event.key == `Tab`) {
					event.preventDefault()
					document.execCommand(`insertText`, false, `\t`)
				}
			}}
			onInput={({ currentTarget }) => setTextAreaValue(currentTarget.value)}
		/>
	</>
}
