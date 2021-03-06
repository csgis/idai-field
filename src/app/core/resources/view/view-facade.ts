import {Document, FieldDocument} from 'idai-components-2';
import {DocumentsManager} from './documents-manager';
import {FieldReadDatastore} from '../../datastore/field/field-read-datastore';
import {ChangesStream} from '../../datastore/changes/changes-stream';
import {Loading} from '../../../components/widgets/loading';
import {ResourcesStateManager} from './resources-state-manager';
import {ResourcesState} from './state/resources-state';
import {IndexFacade} from '../../datastore/index/index-facade';
import {ProjectConfiguration} from '../../configuration/project-configuration';
import {M} from '../../../components/messages/m';
import {Messages} from '../../../components/messages/messages';
import {SyncService} from '../../sync/sync-service';
import {SyncStatus} from '../../sync/sync-process';


export type ResourcesViewMode = 'map'|'list'|'types';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {

    private documentsManager: DocumentsManager;
    private ready: boolean;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: FieldReadDatastore,
        private remoteChangesStream: ChangesStream,
        private resourcesStateManager: ResourcesStateManager,
        private loading: Loading,
        private indexFacade: IndexFacade,
        private messages: Messages,
        private syncService: SyncService
    ) {
        this.documentsManager = new DocumentsManager(
            datastore,
            remoteChangesStream,
            resourcesStateManager,
            loading,
            (indexName: string, matchTerm: string) => indexFacade.getCount(indexName, matchTerm)
        );
    }


    public addNewDocument = (document: FieldDocument) => this.documentsManager.addNewDocument(document);

    public removeNewDocument = () => this.documentsManager.removeNewDocument();

    public getView = (): string => this.resourcesStateManager.get().view;

    public getCurrentOperation = (): FieldDocument|undefined => this.resourcesStateManager.getCurrentOperation();

    public isInSpecialView = () => this.resourcesStateManager.isInSpecialView();

    public isInOverview = () => this.resourcesStateManager.isInOverview();

    public isInTypesManagement = () => this.resourcesStateManager.isInTypesManagement();

    public getMode = () => this.resourcesStateManager.getMode();

    public getFilterCategories = () => ResourcesState.getCategoryFilters(this.resourcesStateManager.get());

    public getCustomConstraints = () => ResourcesState.getCustomConstraints(this.resourcesStateManager.get());

    public getDocuments = () => this.documentsManager.getDocuments();

    public getSelectedDocument = () => ResourcesState.getSelectedDocument(this.resourcesStateManager.get());

    public getTotalDocumentCount = () => this.documentsManager.getTotalDocumentCount();

    public getChildrenCount = (document: FieldDocument) => this.documentsManager.getChildrenCount(document);

    public getActiveLayersIds = () => ResourcesState.getActiveLayersIds(this.resourcesStateManager.get());

    public deselect = () => this.documentsManager.deselect();

    public setActiveLayersIds = (activeLayersIds: string[]) => this.resourcesStateManager.setActiveLayersIds(activeLayersIds);

    public setMode = (mode: ResourcesViewMode) => this.resourcesStateManager.setMode(mode);

    public setLimitSearchResults = (limitSearchResults: boolean) => this.resourcesStateManager.setLimitSearchResults(limitSearchResults);

    public isNewDocumentFromRemote = (document: Document) => this.documentsManager.isNewDocumentFromRemote(document);

    public getSearchString = () => ResourcesState.getQueryString(this.resourcesStateManager.get());

    public setSearchString = (q: string, populate?: boolean) => this.documentsManager.setQueryString(q, populate);

    public setFilterCategories = (categories: string[]) => this.documentsManager.setCategoryFilters(categories);

    public setCustomConstraints = (constraints: { [name: string]: string}) => this.documentsManager.setCustomConstraints(constraints);

    public rebuildNavigationPath = () => this.resourcesStateManager.rebuildNavigationPath();

    public populateDocumentList = () => this.documentsManager.populateDocumentList();

    public setActiveDocumentViewTab = (activeDocumentViewTab: string|undefined) => this.resourcesStateManager.setActiveDocumentViewTab(activeDocumentViewTab);

    public isInExtendedSearchMode = () => ResourcesState.isInExtendedSearchMode(this.resourcesStateManager.get());

    public setExtendedSearchMode = (extendedSearchMode: boolean) => this.documentsManager.setExtendedSearchMode(extendedSearchMode);

    public getExpandAllGroups = () => ResourcesState.getExpandAllGroups(this.resourcesStateManager.get());

    public toggleExpandAllGroups = () => this.resourcesStateManager.toggleExpandAllGroups();

    public navigationPathNotifications = () => this.resourcesStateManager.navigationPathNotifications();

    public deselectionNotifications = () => this.documentsManager.deselectionNotifications();

    public populateDocumentsNotifications = () => this.documentsManager.populateDocumentsNotifactions();

    public documentChangedFromRemoteNotifications = () => this.documentsManager.documentChangedFromRemoteNotifications();

    public deactivateView = (viewName: string) => this.resourcesStateManager.deactivateView(viewName);

    public removeView = (viewName: string) => this.resourcesStateManager.removeView(viewName);

    public isReady = () => this.ready && !this.documentsManager.isPopulateInProgress();

    public getNavigationPath = () => ResourcesState.getNavigationPath(this.resourcesStateManager.get());


    public async selectView(viewName: 'project'|'types'|string): Promise<void> {

        this.ready = false;
        await this.resourcesStateManager.initialize(viewName);
        await this.populateDocumentList();
        this.ready = true;
    }


    public async setSelectedDocument(resourceId: string, adjustListIfNecessary?: boolean) {

        try {
            await this.documentsManager.setSelected(resourceId, adjustListIfNecessary);
        } catch (err) {
            await this.populateDocumentList();
            await this.rebuildNavigationPath();
            this.messages.add([this.getMissingResourceMessage()]);
        }
    }


    public async moveInto(document: FieldDocument|string|undefined, resetFiltersAndSelection: boolean = false,
                          rebuildNavigationPath: boolean = false) {

        try {
            await this.documentsManager.moveInto(document, resetFiltersAndSelection, rebuildNavigationPath);
        } catch (err) {
            await this.populateDocumentList();
            await this.rebuildNavigationPath();
            if (document && typeof(document) !== 'string') {
                this.messages.add([M.RESOURCES_ERROR_RESOURCE_DELETED, document.resource.identifier]);
            } else {
                this.messages.add([this.getMissingResourceMessage()]);
            }
        }
    }


    public async navigateDocumentList(direction: 'previous'|'next') {

        try {
            await this.documentsManager.navigateDocumentList(direction);
        } catch (err) {
            await this.populateDocumentList();
            await this.rebuildNavigationPath();
            this.messages.add([this.getMissingResourceMessage()]);
        }
    }


    private getMissingResourceMessage(): string {

        return this.syncService.getStatus() === SyncStatus.Pulling
            ? M.RESOURCES_ERROR_RESOURCE_MISSING_DURING_SYNCING
            : M.RESOURCES_ERROR_UNKNOWN_RESOURCE_DELETED;
    }
}
