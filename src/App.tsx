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

	const getTokens = createMemo(() => {
		try {
			return [ ...tokenise(getTextAreaValue()) ]
		} catch (error) {
			console.error(error)
		}
	})

	const squiglyBracketHighlight = new Highlight
	const squareBracketHighlight = new Highlight
	const punctuationHighlight = new Highlight
	const booleanHighlight = new Highlight
	const numberHighlight = new Highlight
	const nullHighlight = new Highlight
	const stringHighlight = new Highlight

	CSS.highlights
		.set(`squigly-bracket`, squiglyBracketHighlight)
		.set(`square-bracket`, squareBracketHighlight)
		.set(`punctuation`, punctuationHighlight)
		.set(`boolean`, booleanHighlight)
		.set(`number`, numberHighlight)
		.set(`null`, nullHighlight)
		.set(`string`, stringHighlight)

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
		>{getTextAreaValue()}</div>

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
