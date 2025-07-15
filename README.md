# lit-gist

To install dependencies:

```bash
bun install
```

To run:

add a `LIT_PRIVATE_KEY` into your `.env`

then run:

```bash
bun run lit
```

### Files
`action.ts`: code to run in the lit action

`lit.ts`: auths & calls lit to run action

`createPkp.ts`: currently not used, but can be run to create a PKP tied to Lit action code

This project was created using `bun init` in bun v1.2.15. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


