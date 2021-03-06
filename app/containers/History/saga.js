import {takeEvery, delay} from 'redux-saga';
import {call, put} from 'redux-saga/effects';
import fetch from 'utils/fetch';
import moment from 'utils/date';
import store from 'store';

const {doGet, doPost} = fetch;

function* getHistory(action) {
	try {
		const currentCount = store.getState().history.list.length;
		const filter = getFilter(action.equipmentId);
		const response = yield call(doPost, '/history/getHistory', {filter, currentCount});
		const {history, hasOlder} = response.result;
		const finalHistory = filterHistoryInfo(history);
		yield put({type: 'GET_HISTORY', history: finalHistory, hasOlder});
	} catch (e) {
		yield put({type: 'FETCH_FAILED', message: e});
	}
}

function* clearHistory(action) {
	try {
		yield put({type: 'CLEAR_HISTORY_NULL'});
	} catch (e) {
		yield put({type: 'FETCH_FAILED', message: e});
	}
}

      

function* historySaga() {
	yield [
		takeEvery('GET_HISTORY_ASYNC', getHistory),
		takeEvery('CLEAR_HISTORY', clearHistory)
	];
}

function getFilter(id) {
	const filter = [{
		key: 'equipmentId',
		val: id,
		operator: ' = '
	}];
	return filter;
}

function filterHistoryInfo(history) {
	const newHistory = history.map((el, index) => {
		const {ctime} = el;
		el.ctime = moment.get(ctime, 'YYYY-MM-DD HH:MM');
		return el;
	});
	return newHistory;
}

export default historySaga;
