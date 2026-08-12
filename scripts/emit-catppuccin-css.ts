#!/usr/bin/env node
import { flavors } from "@catppuccin/palette"
import { writeFileSync } from "fs"

writeFileSync(`src/catppuccin.css`, `\
:root {
	color-scheme: light dark;
	${flavors.latte.colorEntries.map(([ name, { hex } ]) => `--${name}: light-dark(${hex}, ${flavors.mocha.colors[name].hex})`).join(`;\n\t`)}
}
`)
