const axios = require('axios');
const { Wit } = require('node-wit');
const client = new Wit({
  accessToken: 'YNYO7PDP33T7LY6PSH37RQ6OB26DE4EU'
});

BASE_URL = 'http://localhost:3009/thesis_bot_backend/common/';
CHECK_BALANCE = BASE_URL + 'check_balance';
SET_BALANCE = BASE_URL + 'set_balance';
CHECK_AFFORDABILITY = BASE_URL + 'check_affordability';
ADD_TO_LIBRARY = BASE_URL + 'add_to_library';
REMOVE_FROM_LIBRARY = BASE_URL + 'remove_from_library';
REMOVE_LIBRARY = BASE_URL + 'remove_library';
SHOW_AVAILABLE_GAMES = BASE_URL + 'show_available_games';
SHOW_LIBRARY_GAMES = BASE_URL + 'show_library_games';
PURCHASE = BASE_URL + 'purchase';
ADD_BALANCE = BASE_URL + 'add_balance';
GET_PREFERRED_GAMES = BASE_URL + 'get_preferred_games';
IS_GENRE_CORRECT = BASE_URL + 'is_genre_correct';
IS_PLATFORM_CORRECT = BASE_URL + 'is_platform_correct';

BASE_URL_CART = 'http://localhost:3010/';
ADD_CART = BASE_URL_CART + 'add';
REMOVE_GAME_FROM_CART = BASE_URL_CART + 'remove';
REMOVE_ALL_GAMES_FROM_CART = BASE_URL_CART + 'remove_all';
GET_PREFERENCE = BASE_URL_CART + 'get_preference';
SAVE_PREFERENCE = BASE_URL_CART + 'save_preference';


const getAvailableGameNames = async () => {
  try {
    const resp = await axios.get(SHOW_AVAILABLE_GAMES);
    return resp.data.map(game => game.name);
  }
  catch (err){
    console.log('Error in getAvailableGameNames');
  }
};

const getBalance = async () => {
  try {
    const resp = await axios.get(CHECK_BALANCE);
    return resp.data.balance;
  }
  catch(err) {
    console.log('Error in getBalance');
  }
};

const addGamesToCart = async (games) => {
  try {
    await axios.post(ADD_CART, { "games": games });
  }
  catch(err) {
    console.log('Error in addGamesToCart');
  }
}

const getCart = async () => {
  try {
    let res = await axios.get(BASE_URL_CART);
    return res.data.cart;
  }
  catch(err) {
    console.log('Error in getCart');
  }
};

const removeGamesFromCart = async (games) => {
  try {
    let res = await axios.post(REMOVE_GAME_FROM_CART, { games });
    return res.data.cart;
  }
  catch(err) {
    console.log('Error in removeGamesFromCart');
  }
};

const removeAllGamesFromCart = async () => {
  try {
    let res = await axios.post(REMOVE_ALL_GAMES_FROM_CART);
    if(res.status !== 200) throw new Error();
  }
  catch(err) {
    console.log('Error in removeAllGamesFromCart');
  }
};

const getGameIdsFromGameNames = async (games) => {
  try {
    let res = await axios.get(SHOW_AVAILABLE_GAMES);
    let availableGames = res.data;

    let game_ids = availableGames
      .filter((game) => games.map(gameName => gameName.toLowerCase()).includes(game.name.toLowerCase()))
      .map(game => game.game_id);
    return game_ids;
  }
  catch(err) {
    console.log('Error in getGameIdsFromGameNames');
  }
};

const isCartAffordable = async () => {
  try {

    let cartGames = await getCart();

    if(!cartGames || !cartGames.length){
      return [
        `Your cart is empty..`
      ];
    }

    let game_ids = await getGameIdsFromGameNames(cartGames);
    let res = await axios.get(CHECK_AFFORDABILITY, { data: { game_ids } });
    isAffordableObj = res.data;

    if(!isAffordableObj) throw new Error();

    if(!isAffordableObj.can_afford) {
      return [
        `Sorry, but you can't afford it.`,
        `Your balance is ${isAffordableObj.balance} euro(s)`,
        `Total cost of the cart is ${isAffordableObj.cost}`,
        `You need to add ${isAffordableObj.shortage} euro(s)`
      ];
    }
    return [
      `Yes, you can checkout your cart.`,
      `Your balance is ${isAffordableObj.balance} euro(s)`,
      `Total cost of the cart is ${isAffordableObj.cost}`,
      `You'll have ${isAffordableObj.balance - isAffordableObj.cost} euro(s) in account afterwards.`
    ];
  }
  catch(err) {
    console.log('Error in isCartAffordable');
  }
};


const removeAllFromCart = async () => {
  try {
    let res = await axios.post(REMOVE_ALL_GAMES_FROM_CART);
    return [
      'Everything has been removed from cart.'
    ];
  }
  catch(err) {
    console.log('Error in removeAllFromCart');
  }
};

const purchaseCart = async () => {
  try {

    let gamesInCart = await getCart();
    if(!gamesInCart || !gamesInCart.length) {
      return [
        'Your cart is empty.'
      ];
    }

    let game_ids = await getGameIdsFromGameNames(gamesInCart);
    let res = await axios.get(CHECK_AFFORDABILITY, { data: { game_ids } });
    isAffordableObj = res.data;

    if(!isAffordableObj) throw new Error();

    if(!isAffordableObj.can_afford) {
      return [
        `Sorry, but you can't afford it.`,
        `Your balance is ${isAffordableObj.balance} euro(s)`,
        `Total cost of the cart is ${isAffordableObj.cost}`,
        `You need to add ${isAffordableObj.shortage} euro(s)`
      ];
    }
    
    res = await axios.post(PURCHASE, { game_ids });
    if(res.status === 200) {
      await removeAllFromCart();
      return [
        `Purchase successful. You can check your library now.`
      ];
    }
    else return [
      `Purchase failed. Something went wrong. Try again later.`
    ];
  }
  catch(err) {
    console.log('Error in purchaseCart');
  }
};


const getLibraryGameNames = async () => {
  try {
    let res = await axios.get(SHOW_LIBRARY_GAMES);
    let libraryGames = res.data.library;
    if(!libraryGames) throw new Error();
    if(!libraryGames.length) return [];
    
    return libraryGames.map(game => game.name);
  }
  catch(err) {
    console.log('Error in getLibraryGameNames');
  }
};

const getShowLibraryGamesMsg = async () => {
  let libraryGameNames = await getLibraryGameNames();

  if(!libraryGameNames){
    return [
      `Couldn'\t retrieve library games.`
    ];
  }
  else if(!libraryGameNames.length){
    return [
      `Your library is empty.`
    ];
  }
  else {
    libraryGameNames.unshift('Games in your library are:');
    return libraryGameNames;
  }
};


const removeGameFromLibrary = async (gameNames) => {
  try {
    let game_ids = await getGameIdsFromGameNames(gameNames);
    let res = await axios.post(REMOVE_FROM_LIBRARY, { game_ids });
    if(res.status !== 200) throw new Error();
    return res.data.library;
  }
  catch(err) {
    console.log('Error in removeGameFromLibrary');
  }
};

const getRemoveGameFromLibraryMsg = async (gameNames) => {
  try {
    let remainingGames = await removeGameFromLibrary(gameNames);
    if(!remainingGames) {
      return [
        'Something went wrong...couldn\'t remove from library'
      ];
    }
    if(!remainingGames.length) {
      return [
        'Removed games. Library is empty.'
      ];
    }
    else {
      remainingGames = remainingGames.map(game => game.name);
      remainingGames.unshift('Games removed. Remaining games are: ');
      return remainingGames;
    }
  }
  catch(err) {
    console.log('Error in getRemoveGameFromLibraryMsg');
  }
}

const addMoney = async (amount) => {
  try {
    console.log(typeof amount);
    let res = await axios.post(ADD_BALANCE, { amount });
    return res.data;
  }
  catch(err) {
    console.log('Error in addMoney');
  }
};

const getAddMoneyMsg = async (amount) => {
  let balanceNAmount = await addMoney(amount);

  if(!balanceNAmount) {
    return [
      'Sorry could not add balance. Something went wrong.'
    ];
  }

  return [
    `${balanceNAmount.amount} euros added. New balance is ${balanceNAmount.balance}.`
  ];
};

const getDeleteCartMsg = async () => {
  try {
    await removeAllGamesFromCart();
    return ['Everything from your cart has been deleted.'];
  }
  catch (err) {
    return ['Something went wrong. Couldn\'t remove items from cart.'];
  }
};

const getRemoveLibraryMsg = async () => {
  try {
    let res = await axios.post(REMOVE_LIBRARY);
    if(res.status !== 200) {
      return ['Something went wrong. Couldn\'t remove library.'];
    }
    else {
      return ['Removed your library.'];
    }
  }
  catch(err) {
    console.log('Error in getRemoveLibraryMsg');
  }
};

const getPreference = async () => {
  try {
    let res = await axios.get(GET_PREFERENCE);
    return res.data.preference;
  }
  catch(err) {
    console.log('Error in getPreference');
  }
};

const savePreference = async (preference) => {
  try {
    await axios.post(SAVE_PREFERENCE, { preference });
  }
  catch(err) {
    console.log('Error in savePreference');
  }
};

const getPreferedAvailableGamesMsg = async () => {
  try {
    let preference = await getPreference();
    if(!preference) return ['You haven\'t set any preferences yet.'];
    let res = await axios.get(GET_PREFERRED_GAMES, { data: { preference } });
    let preferred_games = res.data.map(game => game.name);
    if(preferred_games.length) return preferred_games;
    else return ['Sorry. None of the games matchs your preferences.'];
  }
  catch(err) {
    console.log('Error in getPreferedAvailableGamesMsg');
    return ['Something went wrong. I couldn\'t filter out the games.'];
  }
};

const isGenreCorrect = async (genre) => {
  try {
    let res = await axios.get(IS_GENRE_CORRECT, { data: { genre } });
    if(res.data.correct) return true;
    return false;
  }
  catch(err) {
    console.log('Error in isGenreCorrect');
  }
};

const isPlatformCorrect = async (platform) => {
  try {
    let res = await axios.get(IS_PLATFORM_CORRECT, { data: { platform } });
    if(res.data.correct) return true;
    return false;
  }
  catch(err) {
    console.log('Error in isPlatformCorrect');
  }
};


const printLotsOfNewLines = () => {
  console.log();
  console.log();
  console.log();
  console.log();
  console.log();
  console.log();
};

const witAI = async (text) => {
  return client.message(text);
};



//https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
const isNumeric = (testStr) => {
  if(isNaN(testStr)) return false;
  if(typeof testStr === "number") return true;
  if(typeof testStr != "string") return false;
  return !isNaN(testStr) && !isNaN(parseFloat(testStr));
};


module.exports = {
  getAvailableGameNames,
  getBalance,
  addGamesToCart,
  getCart,
  removeGamesFromCart,
  removeAllFromCart,
  getGameIdsFromGameNames,
  isCartAffordable,
  getDeleteCartMsg,
  purchaseCart,
  getShowLibraryGamesMsg,
  getRemoveGameFromLibraryMsg,
  getRemoveLibraryMsg,
  savePreference,
  getPreferedAvailableGamesMsg,
  getAddMoneyMsg,
  isGenreCorrect,
  isNumeric,
  isPlatformCorrect,
  printLotsOfNewLines,
  witAI
};