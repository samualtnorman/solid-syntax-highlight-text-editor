import { createEffect } from "solid-js"

export const createRange = ({ start, end, highlight }: {
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
