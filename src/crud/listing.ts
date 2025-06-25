import {AllTestsRunnable, CrudAction, handleCrudActionSupport} from "../utils";
import {AuthConfig, CrudActionsConfig} from "../types";

// TODO:: test everything with invalid token (if https://github.com/antify/ui-module/issues/45 is implemented)
// TODO:: test everything with no permission to do it in token (if https://github.com/antify/ui-module/issues/45 is implemented)
type ListingHooks = {
	loadAndShowTheListingPage: {
		scenarioInitialLoadTheListingPage: {
			/**
			 * Make sure:
			 * - that special buttons in table nav bar are shown and in skeleton state
			 */
			whenIVisitThePage?: () => void

			/**
			 * Make sure:
			 * - that the listing table contains correct columns
			 * - that special buttons in table nav bar are shown and not in skeleton state anymore
			 */
			whenDataIsLoaded: () => void
		}
	}

	filteringTheTable?: {
		/**
		 * If the entry has custom filters e.g. filter a car by color, write the scenarios here.
		 *
		 * Make sure:
		 * - that the listing table show correct filtered entries on a filled database
		 * - that table shows correct empty state on an empty database
		 *
		 * You can use the util functions testCustomTableFilterScenario and testCustomTableFilterWithEmptyResultScenario
		 * for easy implementation.
		 */
		customFilterScenarios?: () => void
	}
}

export type ListingConfig = CrudActionsConfig & AuthConfig & {
	/**
	 * To test the listing page, the entry must support this action
	 */
	hasListingPage?: true

	amountOfEntries?: number

	amountOfPages?: number

	itemsPerPage?: number

	hasPagination?: boolean

	/**
	 * Url to visit the listing page
	 */
	listingUrl: string

	/**
	 * Url to fetch all entries from api endpoint
	 */
	listingApiUrl: string

	loadFixtures: () => void

	truncateEntries: () => void
};

export class CrudListingTests extends AllTestsRunnable {
	constructor(private config: ListingConfig, private hooks: ListingHooks) {
		super();
	}

	loadAndShowTheListingPage() {
		if (!this.config.amountOfEntries) {
			this.config.amountOfEntries = 100;
		}

		if (!this.config.amountOfPages) {
			this.config.amountOfPages = 5;
		}

		if (!this.config.itemsPerPage) {
			this.config.itemsPerPage = 20;
		}

		if (this.config.hasPagination === undefined) {
			this.config.hasPagination = true;
		}

		describe('Feature: Load and show the listing page', () => {
			it('Scenario: Initial load the listing page', () => {
				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log('When I visit the listing page');
				cy.visit(this.config.listingUrl);

				cy.log('Then I should see all elements of the page in skeleton state');
				// TODO:: be more specific here. Graph all elements and check with data-e2e-skeleton=true (If https://github.com/antify/ui-module/issues/46 is implemented)
				cy.get('[data-e2e=crud] [data-e2e=skeleton]').should('exist');

				this.hooks.loadAndShowTheListingPage.scenarioInitialLoadTheListingPage.whenIVisitThePage?.();

				cy.log('When the data is loaded');
				cy.log('Then I should see no elements in skeleton state anymore');
				cy.get('[data-e2e=crud] [data-e2e=skeleton]').should('not.exist');

				cy.log('And I should see the table filter bar with search input field, filter button and create button');
				cy.get('[data-e2e=crud-table-filter] [data-e2e=search]').should('exist');
				cy.get('[data-e2e=crud-table-filter] [data-e2e=create-button]').should('exist');

				if (this.config.hasPagination) {
					cy.log('And I should see the pagination bar with number of entries, items per page and the page switcher');
					cy.get('[data-e2e=crud-table-nav] [data-e2e=items-per-page]').should('exist');
					cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').should('exist');
				}

				this.hooks.loadAndShowTheListingPage.scenarioInitialLoadTheListingPage.whenDataIsLoaded();
			});

			it('Scenario: On a filled database, the user should see a list of entries', () => {
				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log(`And there are ${this.config.amountOfEntries} entries in the database`);
				this.config.loadFixtures();

				cy.log('When I visit the listing page');
				cy.visit(this.config.listingUrl);

				if (this.config.isDeleteAble !== false) {
					cy.log('Then I should see the table with delete buttons for each row in action column');
					cy.get('[data-e2e=table] [data-e2e=delete-button]').should('exist');
				}

				if (this.config.hasUpdatePage !== false) {
					cy.log((this.config.isDeleteAble !== false ? 'And' : 'Then') + ' I should see the table with edit buttons for each row in action column');
					cy.get('[data-e2e=table] [data-e2e=edit-button]').should('exist');
				}

				if (this.config.isDuplicateAble !== false) {
					cy.log((this.config.isDeleteAble !== false || this.config.hasUpdatePage !== false ?
							'And' : 'Then') +
						' I should see the table with duplicate buttons for each row in action column');
					cy.get('[data-e2e=table] [data-e2e=duplicate-button]').should('exist');
				}

				if (this.config.hasPagination) {
					cy.log(
						(this.config.isDeleteAble !== false || this.config.hasUpdatePage !== false || this.config.isDuplicateAble !== false ?
							'And' : 'Then') +
						` I should see that there are 1 - ${this.config.amountOfEntries! < this.config.itemsPerPage! ? this.config.amountOfEntries : this.config.itemsPerPage} of ${this.config.amountOfEntries} entries`);
					cy.get('[data-e2e=items-per-page]').contains(/Items per page|Einträge pro Seite/);
					cy.get('[data-e2e=items-per-page] [data-e2e=select]').contains(`${this.config.itemsPerPage}`);
					cy.get('[data-e2e=items-per-page]').contains(`1 - ${this.config.amountOfEntries! < this.config.itemsPerPage! ? this.config.amountOfEntries : this.config.itemsPerPage}`);
					cy.get('[data-e2e=items-per-page]').contains(/of|von/);
					cy.get('[data-e2e=items-per-page]').contains(`${this.config.amountOfEntries}`);

					cy.log(`And I should see the pagination with ${this.config.amountOfPages} pages`);

					if (this.config.amountOfPages! <= 3) {
						for (let i = 1; i <= this.config.amountOfPages!; i++) {
							cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains(`${i}`);
						}
					} else {
						cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains('1');
						cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains('2');
						cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains('3');
						cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains('...');
						cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains(`${this.config.amountOfPages}`);
					}
				}
			});

			it('Scenario: On an empty database, a describe text should get shown', () => {
				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log('And there are no entries in the database');
				this.config.truncateEntries();

				cy.log('When I visit the listing page');
				cy.visit(this.config.listingUrl);

				cy.log('Then I should see the table with no entries and a describe text');
				cy.get('[data-e2e=table]').contains('We couldn\'t find any entry');

				if (this.config.hasPagination) {
					cy.log('And I should see the pagination with only one page');
					cy.get('[data-e2e=crud-table-nav] [data-e2e=pagination]').contains('1');
				}
			});

			// TODO:: Test on production mode. There should be no sensitive data shown and a friendly message should be shown.
			it('Scenario: On a broken server, the error page should get shown', () => {
				cy.intercept('GET', this.config.listingApiUrl, {
					statusCode: 500,
					body: {
						statusCode: 500,
						message: 'Internal Server Error',
						fatal: true
					}
				}).as('getList');

				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log('And I am on the listing page');
				cy.visit(this.config.listingUrl);

				cy.log('When request fails with 500');
				cy.wait('@getList');

				cy.log('Then I see the error page');
				expect(cy.get('body').contains('Internal Server Error'));
			});
		});
	}

	paginateListingTable() {
		if (!this.config.hasPagination) {
			return;
		}

		describe('Feature: Paginate listing table', () => {
			it('Scenario: Switch from page one to two', () => {
				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log(`And there are ${this.config.amountOfEntries} entries in the database`);
				this.config.loadFixtures();

				cy.log('And I am on the listing page');
				cy.visit(this.config.listingUrl);

				cy.log('When I click on the second page');
				cy.get('[data-e2e=pagination] [data-e2e=button]:contains("2")').click();

				cy.log('Then I see that the table is in loading state');
				cy.get('[data-e2e=crud] [data-e2e=spinner]').should('exist');

				cy.log('When the data is loaded');
				cy.log('Then I see no spinner anymore');
				cy.get('[data-e2e=crud] [data-e2e=spinner]').should('not.exist');

				cy.log('And in pagination, the second page is active');
				cy.get('[data-e2e=pagination] [data-e2e=button]:contains("2")').should('have.data', 'e2eState', 'primary');

				cy.log('And the current page is in url query');
				cy.url().should('contain', 'p=2');
			});

			it('Scenario: Switch from page one to two with 0 entries', () => {

			});

			// TODO:: test visit page initial with query
			// TODO:: Test when change items per page to 50
		});
	}

	deleteEntriesFromTable() {
		if (!handleCrudActionSupport(this.config, CrudAction.isDeleteAble)) {
			return;
		}

		describe('Feature: Delete entries from table', () => {
			it('Scenario: Delete an entry from listing page', () => {
				cy.log('Given I am logged in as a user with permissions to read all entries');
				for (const [key, value] of Object.entries(this.config.cookieValueWithPermissions)) {
					cy.setCookie(key, value);
				}

				cy.log(`And there are ${this.config.amountOfEntries} entries in the database`);
				this.config.loadFixtures();

				cy.log('And I am on the listing page');
				cy.visit(this.config.listingUrl);

				cy.log('When I click on delete button on the first entry');
				cy.get('table tr:first-child [data-e2e=delete-button]').click()

				cy.log('Then I see a delete dialog which asks me if I am sure to delete the entry');
				cy.get('[data-e2e=delete-dialog]').should('be.visible');

				cy.log('When I click on the delete button in the delete dialog');
				cy.get('[data-e2e=delete-dialog] [data-e2e=delete-button]').click();

				cy.log('Then the table is in loading state');
				cy.get('[data-e2e=table] [data-e2e=spinner]').should('exist');

				cy.log('And the dialog is closed');
				cy.get('[data-e2e=delete-dialog]').should('not.exist');

				if (this.config.hasPagination) {
					cy.log(`And the items per page shows that there are ${this.config.amountOfEntries! - 1} entries`);
					cy.get('[data-e2e=items-per-page]').should('contain', `${this.config.amountOfEntries! - 1}`);
				}

				cy.log('And a toast is visible with the message "deleted"');
				cy.get('[data-e2e=toast]').contains(/Deleted|Gelöscht/).should('be.visible');
			})
		});
	}

	filteringTheTable() {
		describe('Feature: Filtering the table', () => {
			this.hooks.filteringTheTable?.customFilterScenarios?.();

			// 	if (handleCrudActionSupport(this.config, CrudAction.hasSearchFilter)) {
			// 		it('Scenario: On a filled database, the user filter by search text and get some results', () => {
			// 			testCustomTableFilterScenario({
			// 				filterAction: () => {
			// 					cy.log('When I type "a b c" into the search bar');
			// 					cy.get('[data-e2e=search] input').type('a');
			//
			// 					cy.log('Then the search query is in the url query');
			// 					cy.url().should('contain', 'search=a');
			// 				}
			// 			}, this.config);
			// 		});
			//
			// 		it('Scenario: On a filled database, the user filter by search text and get no results', () => {
			// 			testCustomTableFilterWithEmptyResultScenario({
			// 				filterAction: () => {
			// 					cy.log('When I type "a b c" into the search bar');
			// 					cy.get('[data-e2e=search] input').type('a b c');
			//
			// 					cy.log('Then the search query is in the url query');
			// 					cy.url().should('contain', 'search=a+b+c');
			// 				}
			// 			}, this.config);
			// 		});
			// 	}
		});
	}
}

export const useCrudListingTests = (config: ListingConfig, hooks: ListingHooks) => new CrudListingTests(config, hooks);

/**
 * Util function to test custom table filters e.g. filter a car by color
 * It provides antify codex valid steps. You just implement the custom filtering action and the expected result.
 */
export function testCustomTableFilterScenario(hooks: {
	/**
	 * Filter the table with a custom action e.g. When I change the color filter to "red"
	 */
	filterAction: () => void,

	/**
	 * The expected table behavior e.g. And I see only red cars in the table
	 * Default is: "And I see the table with entries less than 100 entries"
	 */
	expectedTableBehavior?: () => void

	/**
	 * The expected pagination behavior.
	 * Default is: And I see, that the amount of entries is less than 100
	 */
	expectedPaginationBehavior?: () => void
}, config: ListingConfig) {
	cy.log('Given I am logged in as a user with permissions to read all entries');
	for (const [key, value] of Object.entries(config.cookieValueWithPermissions)) {
		cy.setCookie(key, value);
	}

	cy.log(`And there are ${config.amountOfEntries} entries in the database`);
	config.loadFixtures();

	cy.log('And I am on the listing page');
	cy.visit(config.listingUrl);

	hooks.filterAction();

	cy.log('Then I see the table is in loading state');
	cy.get('[data-e2e=table] [data-e2e=spinner]').should('exist');

	cy.log('When the data is loaded');
	cy.log('Then I see no spinner anymore');
	cy.get('[data-e2e=table] [data-e2e=spinner]').should('not.exist');

	if (!hooks.expectedTableBehavior) {
		cy.log(`And I see the table with less than ${config.amountOfEntries} entries`);
		cy.get('[data-e2e=table] tr').should('have.length.lessThan', config.amountOfEntries);
	} else {
		hooks.expectedTableBehavior();
	}

	if (!hooks.expectedPaginationBehavior) {
		cy.log(`And I see, that the amount of entries in the pagination is less than ${config.amountOfEntries}`);
		cy.get('[data-e2e=total-items]').should('have.length.lessThan', config.amountOfEntries);
		// TODO:: test pagination buttons (amount / items per page) = count buttons
	} else {
		hooks.expectedPaginationBehavior();
	}
}

/**
 * Util function to test custom table filters e.g. filter a car by color and expect no results
 * It provides antify codex valid steps. Just implement the custom filtering action
 */
export function testCustomTableFilterWithEmptyResultScenario(hooks: {
	/**
	 * Filter the table with a custom action e.g. When I change the color filter to "red"
	 */
	filterAction: () => void,
}, config: ListingConfig) {
	testCustomTableFilterScenario({
		filterAction: hooks.filterAction,

		expectedTableBehavior: () => {
			cy.log('And I see the table with no entries');
			cy.get('[data-e2e=table]').should('contain', 'We couldn\'t find any entry');
		},

		expectedPaginationBehavior: () => {
			cy.log('And I see the the amount of entries is 0');
			cy.get('[data-e2e=items-per-page] [data-e2e=total-items]').should('contain', '0');

			cy.log('And I see the pagination with only one page');
			cy.get('[data-e2e=pagination]').should('contain', '1');
		}
	}, config);
}
