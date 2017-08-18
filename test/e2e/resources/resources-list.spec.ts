import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';

const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

describe('resources/list --', function() {

    beforeEach(function () {
        ResourcesPage.get();
        ResourcesPage.clickListModeButton();
    });

    it('show newly created resource in list view', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1, true);

        ResourcesPage.getListModeInputFieldValue('1', 0).then(
            inputValue => { expect(inputValue).toEqual('1'); }
        );

        ResourcesPage.getListModeInputFieldValue('1', 1).then(
            inputValue => { expect(inputValue).toEqual('Resource 1'); }
        );
    });

    it('save changes on input field blur', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1, true);
        ResourcesPage.performCreateResource('2', 0, 'Resource 2', 1, true);

        ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        ResourcesPage.getListModeInputField('2', 0).click();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });

    it('restore identifier from database if a duplicate identifier is typed in', function() {
        ResourcesPage.performCreateResource('1', 0, 'Resource 1', 1, true);
        ResourcesPage.performCreateResource('2', 0, 'Resource 2', 1, true);
        ResourcesPage.performCreateResource('3', 0, 'Resource 3', 1, true);

        ResourcesPage.typeInListModeInputField('2', 0, '1');
        ResourcesPage.getListModeInputField('3', 0).click();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');

        ResourcesPage.getListModeInputFieldValue('2', 0).then(
            inputValue => { expect(inputValue).toEqual('2'); }
        );
    });

    it('perform a fulltext search', () => {
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.typeInIdentifierInSearchField('testf1');
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        expect(ResourcesPage.getListItemEl('context1').getAttribute('class')).toContain('no-search-result');

        ResourcesPage.typeInIdentifierInSearchField(' ');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        expect(ResourcesPage.getListItemEl('context1').getAttribute('class')).not.toContain('no-search-result');
    });

    it('perform a type filter search', () => {
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickChooseTypeFilter(1);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        expect(ResourcesPage.getListItemEl('context1').getAttribute('class')).toContain('no-search-result');

        ResourcesPage.clickChooseTypeFilter('all');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        expect(ResourcesPage.getListItemEl('context1').getAttribute('class')).not.toContain('no-search-result');
    });
});