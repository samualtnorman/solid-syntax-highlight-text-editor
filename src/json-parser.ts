// from https://gist.github.com/samualtnorman/af7c9d247a44de91f4ac52b09c721d4b
export enum TokenTag {
	CloseSquareBracket, CloseSquiglyBracket, Colon, Comma, False, Null, Number, OpenSquareBracket, OpenSquiglyBracket,
	String, True
}

export type Token = { tag: TokenTag, index: number, size: number }

export function* tokenise(source: string): Generator<Token, void, void> {
	const maybeEatDigit = () => maybeEat("0") || maybeEat("1") || maybeEat("2") || maybeEat("3") || maybeEat("4") ||
		maybeEat("5") || maybeEat("6") || maybeEat("7") || maybeEat("8") || maybeEat("9")

	let index = 0

	yield* parseValue()

	function* parseValue(): Generator<Token, void, void> {
		skipWhitespace()

		const tokenIndex = index

		if (maybeEat("{")) {
			yield { tag: TokenTag.OpenSquiglyBracket, index: tokenIndex, size: 1 }
			skipWhitespace()

			const closeSquiglyBracketTokenIndex = index

			if (maybeEat(`}`))
				yield { tag: TokenTag.CloseSquiglyBracket, index: closeSquiglyBracketTokenIndex, size: 1 }
			else {
				while (index < source.length) {
					const stringToken = maybeParseString()

					if (!stringToken)
						throw SyntaxError(`Unexpected character "${source[index]}"`)
			
					yield stringToken
					skipWhitespace()

					const colonIndex = index
		
					if (!maybeEat(":"))
						throw SyntaxError(`Unexpected character "${source[index]}"`)
		
					yield { tag: TokenTag.Colon, index: colonIndex, size: 1 }
					yield* parseValue()

					const commaTokenIndex = index

					if (!maybeEat(","))
						break

					yield { tag: TokenTag.Comma, index: commaTokenIndex, size: 1 }

					skipWhitespace()
				}

				const closeSquiglyBracketTokenIndex = index
	
				if (!maybeEat("}"))
					throw SyntaxError(`Unexpected character "${source[index]}"`)

				yield { tag: TokenTag.CloseSquiglyBracket, index: closeSquiglyBracketTokenIndex, size: 1 }
			}
		} else if (maybeEat("[")) {
			yield { tag: TokenTag.OpenSquareBracket, index: tokenIndex, size: 1 }
			skipWhitespace()

			const closeSquareBracketTokenIndex = index

			if (maybeEat("]"))
				yield { tag: TokenTag.CloseSquareBracket, index: closeSquareBracketTokenIndex, size: 1 }
			else {
				while (index < source.length) {
					yield* parseValue()

					const commaTokenIndex = index

					if (!maybeEat(","))
						break

					yield { tag: TokenTag.Comma, index: commaTokenIndex, size: 1 }
				}

				const closeSquareBracketTokenIndex = index
	
				if (!maybeEat("]"))
					throw SyntaxError(`Unexpected character "${source[index]}"`)

				yield { tag: TokenTag.CloseSquareBracket, index: closeSquareBracketTokenIndex, size: 1 }
			}
		} else
			yield maybeParseString() || maybeParseKeyword() || maybeParseNumber()

		skipWhitespace()
	}

	function maybeParseNumber(): Token {
		const tokenIndex = index

		maybeEat("-")

		if (!maybeEat("0")) {
			if (!(maybeEat("1") || maybeEat("2") || maybeEat("3") || maybeEat("4") || maybeEat("5") || maybeEat("6") ||
				maybeEat("7") || maybeEat("8") || maybeEat("9")
			))
				throw SyntaxError(`Unexpected character "${source[index]}"`)

			while (index < source.length && maybeEatDigit());
		}

		if (maybeEat(".")) {
			if (!maybeEatDigit())
				throw SyntaxError(`Unexpected character "${source[index]}"`)
			
			while (index < source.length && maybeEatDigit());
		}

		if (maybeEat("e") || maybeEat("E")) {
			maybeEat("-") || maybeEat("+")

			if (!maybeEatDigit())
				throw SyntaxError(`Unexpected character "${source[index]}"`)

			while (index < source.length && maybeEatDigit());
		}

		return { tag: TokenTag.Number, index: tokenIndex, size: index - tokenIndex }
	}

	function maybeParseString(): Token | undefined {
		const tokenIndex = index
		
		if (maybeEat(`"`)) {
			while (index < source.length) {
				if (source[index]! < "\x20") {
					throw SyntaxError(`Unexpected character "\\u${
						source.charCodeAt(index).toString(16).toUpperCase().padStart(4, `0`)
					}"`)
				}

				if (maybeEat(`"`))
					return { tag: TokenTag.String, index: tokenIndex, size: index - tokenIndex }

				if (maybeEat("\\")) {
					if (maybeEat("u")) {
						for (let count = 4; count--;) {

							if (maybeEat("0") || maybeEat("1") || maybeEat("2") || maybeEat("3") || maybeEat("4") ||
								maybeEat("5") || maybeEat("6") || maybeEat("7") || maybeEat("8") || maybeEat("9") ||
								maybeEat("a") || maybeEat("b") || maybeEat("c") || maybeEat("d") || maybeEat("e") ||
								maybeEat("f") || maybeEat("A") || maybeEat("B") || maybeEat("C") || maybeEat("D") ||
								maybeEat("E") || maybeEat("F")
							)
								continue

							throw SyntaxError(`Unexpected character "${source[index]}"`)
						}

						continue
					} else if (maybeEat(`"`) || maybeEat("\\") || maybeEat("/") || maybeEat("b") || maybeEat("f") ||
						maybeEat("n") || maybeEat("r") || maybeEat("t")
					)
						continue

					throw SyntaxError(`Unexpected character "${source[index]}"`)
				}

				index++
			}
		}
	}

	function maybeParseKeyword(): Token | undefined {
		const tokenIndex = index
		
		if (maybeEat("true"))
			return { tag: TokenTag.True, index: tokenIndex, size: index - tokenIndex }
		
		if (maybeEat("false"))
			return { tag: TokenTag.False, index: tokenIndex, size: index - tokenIndex }
		
		if (maybeEat("null"))
			return { tag: TokenTag.Null, index: tokenIndex, size: index - tokenIndex }
	}

	function skipWhitespace() {
		while (index < source.length && (maybeEat(" ") || maybeEat("\n") || maybeEat("\r") || maybeEat("\t")));
	}

	function maybeEat(search: string): boolean {
		if (source.startsWith(search, index)) {
			index += search.length
			return true
		}

		return false
	}
}

export function tokensToJson(source: string, tokens: Iterable<Token>): string {
	let json = ``

	for (const token of tokens)
		json += source.slice(token.index, token.index + token.size)

	return json
}