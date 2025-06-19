// Функция для правильной упаковки комментария в бинарный формат (BOC)
function encodeTextPayload(text) {
    // Используем ton_core, который мы подключили в index.html
    const cell = window.ton_core.beginCell()
        .storeUint(0, 32) // op-code для текстового комментария
        .storeStringTail(text)
        .endCell();
    return cell.toBoc().toString('base64'); // Возвращаем в base64
}

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Если открыто не в Telegram, показываем ошибку
    if (Object.keys(tg.initDataUnsafe).length === 0) {
        document.getElementById('app').innerHTML = '<h1>Ошибка</h1><p>Это приложение можно открыть только внутри Telegram.</p>';
        return;
    }

    tg.ready();
    tg.expand();

    const BOT_WALLET_ADDRESS = "UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6"; 

    // Инициализируем TonConnectUI
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://dmmrk.github.io/dice-pay-app/webapp/tonconnect-manifest.json',
        buttonRootId: 'ton-connect-button'
    });

    const paymentForm = document.getElementById('payment-form');
    const sendTxButton = document.getElementById('send-tx-button');
    const amountInput = document.getElementById('amount-input');

    // Показываем/скрываем форму оплаты в зависимости от статуса подключения кошелька
    tonConnectUI.onStatusChange(wallet => {
        paymentForm.classList.toggle('hidden', !wallet);
    });

    // Обрабатываем нажатие на кнопку "Пополнить"
    sendTxButton.addEventListener('click', async () => {
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0.01) {
            alert('Пожалуйста, введите сумму больше 0.01 TON.');
            return;
        }

        const amountNano = Math.floor(amount * 1e9).toString();
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
            alert("Критическая ошибка: не удалось получить ваш Telegram ID.");
            return;
        }

        const comment = `dep_${userId}`;
        const payload = encodeTextPayload(comment);

        // Формируем транзакцию
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
                {
                    address: BOT_WALLET_ADDRESS,
                    amount: amountNano,
                    payload: payload 
                }
            ]
        };

        try {
            // Отправляем транзакцию через TonConnect
            await tonConnectUI.sendTransaction(transaction);
            tg.close();
        } catch (err) {
            console.error("Ошибка при отправке транзакции:", err);
            alert('Произошла ошибка. Пожалуйста, попробуйте снова.');
        }
    });
});
