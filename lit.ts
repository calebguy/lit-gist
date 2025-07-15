import {
  LitActionResource,
  LitPKPResource,
  createSiweMessage,
  generateAuthSig
} from "@lit-protocol/auth-helpers"
import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants"
import { LitNodeClient } from "@lit-protocol/lit-node-client"
import * as ethers from "ethers"
import { litActionCode } from "./action"
import { pacifica } from "./chain"

const privateKey = process.env.LIT_PRIVATE_KEY as string
const RANDOM_CONTRACT_ADDRESS = "0xc75954B9B4Bb4B80883Cf645744612138b7e4870"

export async function doLit() {
  const client = new LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev,
    debug: true,
    alertWhenUnauthorized: true
  })
  await client.connect()

  const ethersWallet = new ethers.Wallet(
    privateKey,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )

  const sessionSigs = await client.getSessionSigs({
    chain: "pacifica",
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution
      },
      {
        resource: new LitPKPResource("*"),
        ability: LIT_ABILITY.PKPSigning
      }
    ],
    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests
    }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await ethersWallet.getAddress(),
        nonce: await client.getLatestBlockhash(),
        litNodeClient: client
      })

      return await generateAuthSig({
        signer: ethersWallet,
        toSign
      })
    }
  })
  const { success, response } = await client.executeJs({
    sessionSigs,
    code: litActionCode,
    jsParams: {
      RANDOM_CONTRACT_ADDRESS: RANDOM_CONTRACT_ADDRESS,
      RPC_URL: pacifica.rpcUrls.default.http[0],
      CHAIN_ID: pacifica.id
    }
  })
  if (!success) {
    throw new Error("Failed to execute LIT action")
  }
  console.log("response", JSON.parse(response as string))
  return response
}

doLit()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
