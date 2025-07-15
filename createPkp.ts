import {
  AUTH_METHOD_SCOPE,
  AUTH_METHOD_TYPE,
  LIT_NETWORK,
  LIT_RPC
} from "@lit-protocol/constants"
import { LitContracts } from "@lit-protocol/contracts-sdk"
import { ethers } from "ethers"
//@ts-ignore
import Hash from "ipfs-only-hash"
import { litActionCode } from "./action"

export async function runAuth() {
  const ethersWallet = new ethers.Wallet(
    process.env.LIT_PRIVATE_KEY as string,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )
  const litContracts = new LitContracts({
    signer: ethersWallet,
    network: LIT_NETWORK.DatilDev
  })
  await litContracts.connect()
  const mintCost = await litContracts.pkpNftContract.read.mintCost()
  const ipfsCid = await Hash.of(litActionCode)
  const txn =
    await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
      AUTH_METHOD_TYPE.LitAction,
      [AUTH_METHOD_TYPE.LitAction],
      [ethers.utils.base58.decode(ipfsCid)],
      ["0x"],
      [[AUTH_METHOD_SCOPE.SignAnything]],
      false,
      true,
      { value: mintCost, gasLimit: 4000000 }
    )
  const receipt = await txn.wait()
  const pkpId = receipt.logs[0]?.topics[1]
  if (!pkpId) {
    throw new Error("PKP ID not found")
  }
  const pkpPubkeyInfo = await litContracts.pubkeyRouterContract.read.pubkeys(
    ethers.BigNumber.from(pkpId)
  )
  // console.log("PKP Info:", pkpPubkeyInfo);
  const pkpPublicKey = pkpPubkeyInfo.pubkey
  const pkpEthAddress = ethers.utils.computeAddress(pkpPublicKey)
  const pkpInfo = {
    publicKey: pkpPublicKey,
    ethAddress: pkpEthAddress,
    tokenId: pkpId
  }
  console.log("PKP Info:", pkpInfo)
}

runAuth()
  .then(() => {
    process.exit(0)
    console.log("done")
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
