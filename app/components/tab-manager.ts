import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Document, FieldDocument} from 'idai-components-2';
import {StateSerializer} from '../common/state-serializer';
import {IndexFacade} from '../core/datastore/index/index-facade';
import {FieldReadDatastore} from '../core/datastore/field/field-read-datastore';
import {TabUtil} from './tab-util';
import {TabWidthCalculator} from './tab-width-calculator';


export type Tab = {
    routeName: string,
    label: string
    operationId?: string,
    shown: boolean
}


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class TabManager {

    private tabs: Array<Tab> = [];
    private activeTab: Tab|undefined;


    constructor(indexFacade: IndexFacade,
                private tabWidthCalculator: TabWidthCalculator,
                private stateSerializer: StateSerializer,
                private datastore: FieldReadDatastore,
                private router: Router,
                private i18n: I18n) {

        indexFacade.changesNotifications().subscribe(document => this.updateTabLabels(document));
        this.initialize();

        this.router.events.subscribe(() => {
            this.updateActiveTab(this.router.url);
        });
    }


    public getShownTabs = (): Array<Tab> => this.tabs.filter(tab => tab.shown);

    public getHiddenTabs = (): Array<Tab> => this.tabs.filter(tab => !tab.shown);

    public setTabSpaceWidth = (width: number) => this.tabWidthCalculator.setTabSpaceWidth(width);

    public getTabSpaceWidth = (): number => this.tabWidthCalculator.getTabSpaceWidth();


    async initialize() {

        this.tabs = await this.deserialize();
        await this.openTabForRoute(this.router.url);
        await this.validateTabs();
    }


    public isOpen(routeName: string, resourceId?: string): boolean {

        return this.getTab(routeName, resourceId) !== undefined;
    }


    public async openTab(routeName: string, operationId?: string, operationIdentifier?: string) {

        let tab: Tab|undefined = this.getTab(routeName, operationId);

        if (!tab) {
            tab = {
                routeName: routeName,
                label: this.getLabel(routeName, operationIdentifier),
                operationId: operationId,
                shown: false
            };
            this.tabs.push(tab);
        }

        this.showTab(tab);
        await this.serialize();
    }


    public async closeTab(routeName: string, operationId?: string) {

        this.tabs = this.tabs.filter(tab => {
            return tab.routeName !== routeName || tab.operationId !== operationId;
        });

        this.showAsManyTabsAsPossible();

        await this.serialize();
    }


    public async openActiveTab() {

        if (this.activeTab) {
            await this.router.navigate([this.activeTab.routeName, this.activeTab.operationId]);
        } else {
            await this.router.navigate(['resources', 'project']);
        }
    }


    public resetForE2E() {

        this.tabs = [];
    }


    private async updateTabLabels(document: Document) {

        this.tabs.filter(tab => tab.operationId === document.resource.id)
            .forEach(tab => tab.label = this.getLabel(tab.routeName, document.resource.identifier));

        await this.serialize();
    }


    private async serialize() {

        await this.stateSerializer.store({ tabs: this.tabs }, 'tabs-state');
    }


    private async deserialize(): Promise<Array<Tab>> {

        const loadedState: any = await this.stateSerializer.load('tabs-state');

        return loadedState && loadedState.tabs && Array.isArray(loadedState.tabs)
            ? loadedState.tabs
            : [];
    }


    private async validateTabs() {

        const validatedTabs: Array<Tab> = [];

        for (let tab of this.tabs) {
            if (tab.operationId) {
                try {
                    const document: FieldDocument = await this.datastore.get(tab.operationId);
                    tab.label = this.getLabel(tab.routeName, document.resource.identifier);
                } catch (err) {
                    continue;
                }
            }
            validatedTabs.push(tab);
        }

        this.tabs = validatedTabs;
    }


    private async openTabForRoute(route: string) {

        const {routeName, operationId} = TabUtil.getTabValuesForRoute(route);

        if (operationId !== 'project' && !this.getTab(routeName, operationId)
                && (routeName === 'resources' || routeName === 'matrix')) {
            await this.openTab(routeName, operationId, '');
        }
    }


    private updateActiveTab(route: string) {

        const {routeName, operationId} = TabUtil.getTabValuesForRoute(route);

        const tab: Tab|undefined = this.tabs.find(tab => {
            return tab.routeName === routeName && tab.operationId === operationId;
        });

        if (tab) {
            this.activeTab = tab;
            this.showTab(tab);
        }
    }


    private showTab(tab: Tab) {

        if (tab.shown) return;

        const tabWidth: number = this.tabWidthCalculator.getTabWidth(tab);

        while (this.tabWidthCalculator.getAvailableTabSpaceWidth(this.tabs) < tabWidth) {
            const lastShownTab: Tab|undefined = this.tabs.slice().reverse().find(tab => {
                return tab.shown;
            });

            if (!lastShownTab) {
                console.warn('Failed to show tab', tab);
                return;
            }

            lastShownTab.shown = false;
        }

        tab.shown = true;
    }


    private showAsManyTabsAsPossible() {

        this.tabs.filter(tab => !tab.shown)
            .forEach(tab => {
                if (this.tabWidthCalculator.getAvailableTabSpaceWidth(this.tabs) >= this.tabWidthCalculator.getTabWidth(tab)) {
                    tab.shown = true;
                }
            });
    }


    private getTab(routeName: string, operationId?: string): Tab|undefined {

        return this.tabs.find(tab => {
            return tab.routeName === routeName && tab.operationId === operationId
        });
    }


    private getLabel(routeName: string, operationIdentifier?: string): string {

        switch(routeName) {
            case 'resources':
                return operationIdentifier as string;
            case 'matrix':
                return operationIdentifier + ' – ' + this.i18n({ id: 'navbar.matrix', value: 'Matrix'});
            default:
                return '';
        }
    }
}