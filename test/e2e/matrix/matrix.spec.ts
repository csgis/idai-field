import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {MatrixPage} from './matrix.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Thomas Kleinke
 */
describe('matrix --', () => {

    let i = 0;


    beforeAll(() => {

        MatrixPage.get();
        browser.sleep(delays.shortRest * 4);
    });


    beforeEach(async done => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToMatrix();
        }

        i++;
        done();
    });


    it('show basic matrix', () => {

        browser.wait(EC.presenceOf(MatrixPage.getSvgRoot()), delays.ECWaitTime);

        MatrixPage.getNodes().then(nodes => expect(nodes.length).toBe(5));
        for (let i = 1; i <= 5; i++) {
            browser.wait(EC.presenceOf(MatrixPage.getNode('si' + i)), delays.ECWaitTime);
        }

        MatrixPage.getEdges().then(edges => expect(edges.length).toBe(5));
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si5')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si2', 'si3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si3', 'si4')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getSameRankEdge('si3', 'si5')),
            delays.ECWaitTime);
    });
});