import {CrudActionsConfig} from "./types";

export class AllTestsRunnable {
	runAllTests() {
		Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter((functionName) => functionName !== 'constructor' && functionName !== 'runAllTests')
			.forEach((functionName) => {
				// @ts-ignore
				if (typeof this[functionName] === 'function') {
					// @ts-ignore
					this[functionName]();
				}
			})
	}
}

export enum CrudAction {
	hasListingPage = 'hasListingPage',
	hasSearchFilter = 'hasSearchFilter',
	hasCreatePage = 'hasCreatePage',
	hasUpdatePage = 'hasUpdatePage',
	isDeleteAble = 'isDeleteAble',
	isDuplicateAble = 'isDuplicateAble',
}

export function handleCrudActionSupport(config: CrudActionsConfig, action: CrudAction): boolean {
	if (config[action] === false) {
		console.info(`Action "${action}" is not supported for this entry. Skip tests.`)
		return false;
	}

	return true
}
