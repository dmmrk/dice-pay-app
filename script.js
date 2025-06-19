// --- Упаковка комментария dep_<user_id> в BOC формат ---
function encodeTextPayload(text) {
    if (!window.ton_core) {
        alert("❌ Ошибка: TON Core не загружен.");
        return null;
    }

    const cell = window.ton_core.beginCell()
        .storeUint(0, 32) // msg.dataText (тип сообщения)
        .storeStringTail(text)
        .endCell();

    return cell.toBoc().toString('base64');
}

// --- Инициализация после загрузки страницы ---
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Защита от открытия вне Telegram
    if (!tg.initData) {
        document.getElementById('app').innerHTML = `
            <h1>Ошибка</h1>
            <p>Это приложение можно открыть только внутри Telegram.</p>
        `;
        return;
    }

    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6";

    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    // Показываем/скрываем форму после подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    sendTxButton.addEventListener('click', async () => {
        // ✅ Проверяем, подключен ли кошелек (новый способ)
        const wallet = await tonConnectUI.connectedWallet;
        if (!wallet) {
            alert('Кошелек не подключен. Пожалуйста, сначала подключите кошелек.');
            return;
        }

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Введите сумму больше 0.01 TON.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            alert("❌ Не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;
        const payload = encodeTextPayload(comment);
        if (!payload) return;

        const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // +5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano,
                    payload
                }
            ]
        };

        try {
            await tonConnectUI.sendTransaction(tx);
            tg.close(); // Закрыть WebApp после отправки
        } catch (err) {
            console.error("Ошибка TonConnect:", err);
            alert('Ошибка при отправке транзакции. Попробуйте снова.');
        }
    });
});
