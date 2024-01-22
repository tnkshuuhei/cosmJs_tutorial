import { SigningStargateClient, StargateClient } from "@cosmjs/stargate"
import { DirectSecp256k1HdWallet, OfflineDirectSigner } from "@cosmjs/proto-signing"
import { toUtf8 } from "@cosmjs/encoding"
import { readFile } from "fs/promises"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"

const rpc = "http://seed.dev.mycel.domains:26657"
const CW20_TOKEN = "mycel1hzz0s0ucrhdp6tue2lxk3c03nj6f60qy463we7lgx0wudd72ctms8hew6y"
const getSignerFromMnemonicFile = async (filePath: string): Promise<OfflineDirectSigner> => {
    const mnemonic = (await readFile(filePath)).toString().trim()
    return DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "mycel",
    })
}

const queryBalance = async (address: string): Promise<void> => {
    const aliceSigner: OfflineDirectSigner = await getSignerFromMnemonicFile("./testnet.mycel.mnemonic.key")
    // const alice = (await aliceSigner.getAccounts())[0].address
    const client = await SigningCosmWasmClient.connect(rpc)
    const result = await client.queryContractSmart(CW20_TOKEN, { balance: { address: address } })
    console.log(result)
    return result.balance
}

const transferCW20 = async (): Promise<void> => {
    const aliceSigner: OfflineDirectSigner = await getSignerFromMnemonicFile("./testnet.mycel.mnemonic.key")
    const alice = (await aliceSigner.getAccounts())[0].address
    const bob = "mycel1we0zlvuazyfnm0u57qjjpynmdk6kenvx3vvszp"
    console.log("sender address", alice)
    console.log("sender balance", await queryBalance(alice))
    console.log("recipient address", bob)
    console.log("recipient balance", await queryBalance(bob))
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, aliceSigner)

    const sendMsg = {
        transfer: {
            recipient: bob,
            amount: "10000",
        },
    }
    const msgExecuteContract = {
        // wtf is typeUrl?
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: {
            sender: alice,
            contract: CW20_TOKEN,
            msg: toUtf8(JSON.stringify(sendMsg)),
            funds: [],
        },
    }
    const fee = {
        amount: [{ denom: "umycel", amount: "1000000" }],
        gas: "200000",
    }
    // Execute the sendTokens Tx and store the result
    const result = await signingClient.signAndBroadcast(alice, [msgExecuteContract], fee)
    console.log(result)

    console.log("new alice balance", await queryBalance(alice))
    console.log("new bob balance", await queryBalance(bob))
}

const transferMycel = async (): Promise<void> => {
    const aliceSigner: OfflineDirectSigner = await getSignerFromMnemonicFile("./testnet.mycel.mnemonic.key")
    const alice = (await aliceSigner.getAccounts())[0].address
    const bob = "mycel1we0zlvuazyfnm0u57qjjpynmdk6kenvx3vvszp"
    console.log("sender address", alice)
    console.log("recipient address", bob)
    const signingClient = await SigningStargateClient.connectWithSigner(rpc, aliceSigner)
    // Execute the sendTokens Tx and store the result
    const result = await signingClient.sendTokens(alice, bob, [{ denom: "umycel", amount: "1000000" }], {
        amount: [{ denom: "umycel", amount: "1000000" }],
        gas: "200000",
    })
    console.log(result)

    console.log("alice balance", await signingClient.getBalance(alice, "umycel"))
    console.log("bob balance", await signingClient.getBalance(bob, "umycel"))
}

transferCW20()
// transferMycel()
// queryBalance().catch(console.error)
