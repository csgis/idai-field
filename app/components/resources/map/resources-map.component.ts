import {Component, Input} from '@angular/core';
import {PersistenceManager} from 'idai-components-2/persist';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {SettingsService} from '../../../core/settings/settings-service';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';

@Component({
    selector: 'resources-map',
    moduleId: module.id,
    templateUrl: './resources-map.html'
})

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class ResourcesMapComponent {

    @Input() activeTab: string;

    private updateThumbnails: boolean = true;


    constructor(
        public loading: Loading,
        public viewFacade: ViewFacade,
        public resourcesComponent: ResourcesComponent,
        private persistenceManager: PersistenceManager,
        private settingsService: SettingsService,
        private messages: Messages
    ) { }


    private selectedDocumentIsNew(): boolean {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return false;

        return !selectedDoc.resource.id;
    }


    /**
     * @param geometry
     *   <code>null</code> indicates geometry should get deleted.
     *   <code>undefined</code> indicates editing operation aborted.
     */
    public quitEditing(geometry: IdaiFieldGeometry) {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return;

        if (geometry) {
            selectedDoc.resource.geometry = geometry;
        } else if (geometry === null || !selectedDoc.resource.geometry.coordinates
                || selectedDoc.resource.geometry.coordinates.length == 0) {
            delete selectedDoc.resource.geometry;
        }

        if (this.selectedDocumentIsNew()) {
            if (geometry !== undefined) {
                this.resourcesComponent.editDocument();
            } else {
                this.resourcesComponent.isEditingGeometry = false;
                this.viewFacade.remove(selectedDoc);
            }
        } else {
            this.resourcesComponent.isEditingGeometry = false;
            if (geometry !== undefined) this.save();
        }
    }


    public uploadImages(event: Event, document: IdaiFieldDocument) {

        this.updateThumbnails = false;
        this.resourcesComponent.uploadImages(event, document).then(() => this.updateThumbnails = true);
    }


    private save() {

        const selectedDoc = this.viewFacade.getSelectedDocument();
        if (!selectedDoc) return;

        this.persistenceManager.setOldVersions([selectedDoc]);
        this.persistenceManager.persist(selectedDoc, this.settingsService.getUsername())
            .catch(msgWithParams => this.messages.add(msgWithParams));
    }

}
