import { createMemo, createSignal, For, type JSX } from "solid-js"
import { tokenise, TokenTag } from "./json-parser"

export function App(): JSX.Element {
	let textareaElement!: HTMLTextAreaElement
	const [ getTextAreaValue, setTextAreaValue ] = createSignal(``)

	const getTokens = createMemo(() => {
		try {
			return [ ...tokenise(getTextAreaValue()) ]
		} catch (error) {
			console.error(error)
		}
	})
	
	return <>
		<div
			style="position: absolute; user-select: none; width: 100vw; height: 100vh; white-space: pre-wrap"
		>
			<For each={getTokens()} fallback={<span style="color: red">{getTextAreaValue()}</span>}>
				{(token, getIndex) => <>
					{getIndex() && <span>{getTextAreaValue().slice(getTokens()![getIndex() - 1].index + getTokens()![getIndex() - 1].size, token.index)}</span>}

					<span style={{ color: tokenTagToCssColour(token.tag) }}>
						{getTextAreaValue().slice(token.index, token.index + token.size)}
					</span>
				</>}
			</For>
		</div>

		<textarea
			ref={textareaElement}
			style="width: 100vw; height: 100vh; color: #00000000; caret-color: black; position: absolute; left: 0; white-space: pre-wrap"
			onInput={() => setTextAreaValue(textareaElement.value)}
		/>
	</>
}

function tokenTagToCssColour(tokenTag: TokenTag): string {
	switch (tokenTag) {
		case TokenTag.OpenSquiglyBracket:
		case TokenTag.CloseSquiglyBracket:
			return `blue`

		case TokenTag.OpenSquareBracket:
		case TokenTag.CloseSquareBracket:
			return `cyan`

		case TokenTag.Colon:
		case TokenTag.Comma:
			return `lightgrey`

		case TokenTag.True:
		case TokenTag.False:
			return `blue`

		case TokenTag.Number:
			return `orange`

		case TokenTag.Null:
			return `purple`

		case TokenTag.String:
			return `green`
	}
}
