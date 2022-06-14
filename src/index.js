import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// 引入API
const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require("@polkadot/keyring");

async function main() {
  // 连接节点
  const provider = new WsProvider("ws://127.0.0.1:9944");
  // 创建API实例
  const api = await ApiPromise.create({ provider });

  // 1. 查看本条链的信息
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  //2. 监听出块
  let count = 0;
  const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
    console.log(`Chain is at block: ${header.number}`);

    if (++count === 245) {
      unsubscribe();
      process.exit(0);
    }
  });

  //3.监听某个账户的余额变化
  const Alice = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  let {
    data: { free: previousFree },
    nonce: previousNonce,
  } = await api.query.system.account(Alice);
  console.log(
    `${Alice} has a balance of: ${previousFree}, nonce ${previousNonce}`
  );

  api.query.system.account(
    Alice,
    ({ data: { free: currentFree }, nonce: currentNonce }) => {
      // Calculate the delta
      const change = currentFree.sub(previousFree);

      if (!change.isZero()) {
        console.log(`New balance change of ${change}, nonce ${currentNonce}`);

        previousFree = currentFree;
        previousNonce = currentNonce;
      }
    }
  );

  //4.转账
  const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  const transfer = api.tx.balances.transfer(BOB, 12345);
  const hash = await transfer.signAndSend(alice);
  const Timer = [2, 2];

  const createTrigger = api.tx.templateModule.createTriger(Timer);

  console.log("Transfer sent with hash", hash.toHex());

  //5.读取pallet存储
  const trigger = await api.query.templateModule.mapTriger(0);
  const action = await api.query.templateModule.mapAction(0);
  const recipe = await api.query.templateModule.mapRecipe(0);
  console.log(`The first trigger is ${trigger}`);
  console.log(`The first action is ${action}`);
  console.log(`The first recipe is ${recipe}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
