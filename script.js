function encodeTextPayload(text) {
  const cell = window.ton_core.beginCell()
    .storeUint(0, 32)
    .storeStringTail(text)
    .endCell();
  return cell.toBoc().toString('base64');
}

document.addEventListener('DOMContentLoaded', () => {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6";

  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://dmmrk.github.io/dice-pay-app/webapp/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
  });

  const sendTxButton = document.getElementById('send-tx-button');
  const amountInput = document.getElementById('amount-input');

  sendTxButton.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму в TON.');
      return;
    }

    const amountNano = Math.floor(amount * 1e9);
    const userId = tg.initDataUnsafe?.user?.id;
    const comment = userId ? `dep_${userId}` : null;

    const connectedWallet = await tonConnectUI.connectedWallet;
    if (connectedWallet && comment) {
      // Через TonConnect
      const payload = encodeTextPayload(comment);

      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: BOT_WALLET_ADDRESS,
          amount: amountNano.toString(),
          payload
        }]
      };

      try {
        await tonConnectUI.sendTransaction(tx);
        tg.close();
      } catch (e) {
        console.error("Ошибка TonConnect:", e);
        alert("Ошибка отправки через TonConnect.");
      }
    } else {
      // Через Telegram Wallet
      const link = `https://wallet.ton.org/transfer/${BOT_WALLET_ADDRESS}?amount=${amountNano}`;
      window.location.href = link;
    }
  });
});
