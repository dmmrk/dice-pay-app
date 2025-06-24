// Импортируем библиотеку из node_modules
import { TonConnectUI } from '/node_modules/@tonconnect/ui/dist/tonconnect-ui.mjs';

// --- ВАЖНЫЕ НАСТРОЙКИ ---
// ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА СВОИ!
const RECIPIENT_WALLET = 'UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6';
const MANIFEST_URL = 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json'; 

// --- ИНИЦИАЛИЗАЦИЯ ---
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем user_id из URL, который передал бот (?user_id=12345)
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

// Если ID пользователя не передан, показываем ошибку и не даем работать
if (!userId) {
    tg.showAlert('Ошибка: Не удалось определить ваш ID. Пожалуйста, откройте это окно снова из Telegram-бота.');
    tg.close();
    // Останавливаем выполнение скрипта
    throw new Error("User ID is not provided in URL");
}

const tonConnectUI = new TonConnectUI({
    manifestUrl: MANIFEST_URL,
    buttonRootId: 'ton-connect-button' // ID элемента, куда вставится кнопка "Connect Wallet"
});

// --- ЭЛЕМЕНТЫ DOM ---
const amountInput = document.getElementById('ton-amount-input');
const sendButton = document.getElementById('send-button');
const walletInfoEl = document.getElementById('wallet-info');
const walletAddressEl = document.getElementById('wallet-address');

// --- ЛОГИКА ---

// Показываем или скрываем кнопку "Отправить" и информацию о кошельке
// в зависимости от статуса подключения
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        // Кошелек подключен
        const address = wallet.account.address;
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletInfoEl.classList.remove('hidden');
        sendButton.classList.remove('hidden');
    } else {
        // Кошелек отключен
        walletInfoEl.classList.add('hidden');
        sendButton.classList.add('hidden');
    }
});

// Обработчик нажатия на кнопку "Отправить"
sendButton.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0.01) { // Добавим минимальную сумму для защиты
        tg.showAlert('Пожалуйста, введите корректную сумму (минимум 0.01 TON).');
        return;
    }

    // 1 TON = 1,000,000,000 наноTON
    const amountInNanoTON = Math.round(amount * 1_000_000_000).toString();
    
    // ВАЖНО: Формируем комментарий в формате "dep_<user_id>"
    const comment = `dep_${userId}`;

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 минут
        messages: [
            {
                address: RECIPIENT_WALLET,
                amount: amountInNanoTON,
                // Кодируем комментарий в base64. btoa() - стандартная функция браузера
                payload: btoa(comment) 
            }
        ]
    };

    try {
        // Показываем индикатор загрузки на главной кнопке Telegram
        tg.MainButton.setText('Ожидаем подтверждения в кошельке...').show().showProgress();
        
        // Отправляем транзакцию
        const result = await tonConnectUI.sendTransaction(transaction);

        // Сразу после успешной ОТПРАВКИ передаем BOC боту для финальной ПРОВЕРКИ
        tg.sendData(JSON.stringify({ boc: result.boc }));
        
        tg.MainButton.setText('Готово!').hideProgress();
        tg.showAlert('Транзакция отправлена! Бот пришлет уведомление о зачислении средств.');
        
        // Закрываем WebApp через 3 секунды для удобства пользователя
        setTimeout(() => tg.close(), 3000);

    } catch (error) {
        // Если пользователь отклонил транзакцию или произошла другая ошибка
        tg.MainButton.hideProgress();
        tg.MainButton.setText('Отправка'); // Возвращаем текст кнопки
        console.error('Ошибка отправки транзакции:', error);
        tg.showAlert(`Произошла ошибка: ${error.message || 'Транзакция была отклонена.'}`);
    }
});
