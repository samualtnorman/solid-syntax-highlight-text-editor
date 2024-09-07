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
			return `#7287fd`

		case TokenTag.OpenSquareBracket:
		case TokenTag.CloseSquareBracket:
			return `#209fb5`

		case TokenTag.Colon:
		case TokenTag.Comma:
			return `#7c7f93`

		case TokenTag.True:
		case TokenTag.False:
			return `#1e66f5`

		case TokenTag.Number:
			return `#fe640b`

		case TokenTag.Null:
			return `#8839ef`

		case TokenTag.String:
			return `#40a02b`
	}
	/* Dark background colours
	{
		case TokenTag.OpenSquiglyBracket:
		case TokenTag.CloseSquiglyBracket:
			return `#b4befe`;

		case TokenTag.OpenSquareBracket:
		case TokenTag.CloseSquareBracket:
			return `#74c7ec`;

		case TokenTag.Colon:
		case TokenTag.Comma:
			return `#9399b2`;

		case TokenTag.True:
		case TokenTag.False:
			return `#89b4fa`;

		case TokenTag.Number:
			return `#fab387`;

		case TokenTag.Null:
			return `#cba6f7`;

		case TokenTag.String:
			return `#a6e3a1`;
	
	*/
}