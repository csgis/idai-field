import {Injectable} from '@angular/core';
import {sameset, isArray, isNot, isUndefinedOrEmpty, on, isDefined, to} from 'tsfun';
import {Document, NewDocument} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ConnectedDocsWriter} from './connected-docs-writer';
import {clone} from '../util/object-util';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {HierarchicalRelations} from './relation-constants';
import RECORDED_IN = HierarchicalRelations.RECORDEDIN;
import {DescendantsUtility} from './descendants-utility';


@Injectable()
/**
 * When persisting or deleting, PersistenceManager maintains a consistent state of relations between the
 * documents by updating related documents relations.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceManager {

    private connectedDocsWriter: ConnectedDocsWriter;

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration,
        private descendantsUtility: DescendantsUtility
    ) {
        this.connectedDocsWriter = new ConnectedDocsWriter(this.datastore, this.projectConfiguration);
    }


    /**
     * Persists document and all the objects that are or have been in relation
     * with the object before the method call.
     *
     * If the document is { resource: { id: 1, relations: { includes: [2] } } },
     * this means that also another document is updated, namely { resource: { id: 2 } } }.
     * which gets updated to { resource: { id: 2, relations: { belongsTo: [1] } } }.
     *
     * On top of that, one oldVersion and some revisionsToSquash can be specified.
     * These are compared with document to determine which relations have been removed.
     *
     * @param document an existing or a new document
     * @param username
     * @param oldVersion to be used only if document is an existing document.
     * @param revisionsToSquash these revisions get deleted while updating document
     * @returns a copy of the updated document
     * @throws msgWithParams
     */
    public async persist(document: NewDocument|Document, username: string,
                         oldVersion: Document = document as Document,
                         revisionsToSquash: Document[] = []): Promise<Document> {

        const persistedDocument = await this.updateWithConnections(
            document as Document, oldVersion, revisionsToSquash, username);

        await this.fixIsRecordedInInLiesWithinDocs(persistedDocument, username);
        return persistedDocument;
    }


    /**
     * Removes the document from the datastore.
     *
     * Also removes all child documents (documents with an 'isRecordedIn' or 'liesWithin' relation pointing to
     * this document.
     * Deletes all corresponding inverse relations.
     *
     * @throws
     *   [DatastoreErrors.DOCUMENT_NO_RESOURCE_ID] - if document has no resource id
     *   [DatastoreErrors.DOCUMENT_DOES_NOT_EXIST_ERROR] - if document has a resource id, but does not exist in the db
     *   [DatastoreErrors.GENERIC_DELETE_ERROR] - if cannot delete for another reason
     */
    public async remove(document: Document, username: string) {

        for (let descendant of (await this.descendantsUtility.fetchChildren(document))) {
            await this.removeWithConnectedDocuments(descendant, username);
        }
        await this.removeWithConnectedDocuments(document, username);
    }


    private async updateWithConnections(document: Document, oldVersion: Document,
                                        revisionsToSquash: Array<Document>, username: string) {

        const revs = revisionsToSquash.map(to('_rev')).filter(isDefined);
        const updated = await this.persistIt(document, username, revs);

        await this.connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(
            updated, [oldVersion].concat(revisionsToSquash), username);
        return updated as Document;
    }


    private async removeWithConnectedDocuments(document: Document, username: string) {

        await this.connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(document, username);
        await this.datastore.remove(document);
    }


    private async fixIsRecordedInInLiesWithinDocs(document: Document, username: string) {

        if (isUndefinedOrEmpty(document.resource.relations[RECORDED_IN])) return;

        const docsToCorrect = (await this.findRecordedInDocs(document.resource.id))
            .filter(on('resource.relations.' + RECORDED_IN, isArray))
            .filter(isNot(on('resource.relations.' + RECORDED_IN, sameset)(document)));

        for (let docToCorrect of docsToCorrect) {
            const cloned = clone(docToCorrect);
            cloned.resource.relations[RECORDED_IN] = document.resource.relations[RECORDED_IN];
            await this.datastore.update(cloned, username, undefined);
        }
    }


    private async findRecordedInDocs(resourceId: string): Promise<Array<Document>> {

        return (await this.datastore.find({
            constraints: { 'isRecordedIn:contain': resourceId },
        })).documents;
    }


    private persistIt(document: Document|NewDocument, username: string,
                      squashRevisionIds: string[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document, username);
    }
}