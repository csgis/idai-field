import {DocumentReadDatastore} from '../../datastore/document-read-datastore';
import {Document, toResourceId} from 'idai-components-2';
import {Name, ResourceId} from '../../constants';
import {includedIn} from 'tsfun';
import {ImageRelations} from '../../model/relation-constants';
import {CatalogUtil} from '../../model/catalog-util';


export async function getExportDocuments(datastore: DocumentReadDatastore,
                                         catalogId: ResourceId,
                                         project: Name): Promise<[Array<Document>, Array<ResourceId>]> {

    const catalogAndTypes = await CatalogUtil.getCatalogAndTypes(datastore, catalogId);
    const relatedImages = cleanImageDocuments(
        await CatalogUtil.getCatalogImages(datastore, catalogAndTypes),
        catalogAndTypes.map(toResourceId)
        );
    return [
        catalogAndTypes
            .concat(relatedImages)
            .map(cleanDocument)
            .map(document => {
                document.project = project;
                return document;
            }),
        relatedImages.map(toResourceId)
    ];
}


// TODO maybe move to CatalogUtil; then maybe pass catalogResources instead ids
function cleanImageDocuments(images: Array<Document>,
                             idsOfCatalogResources: Array<ResourceId>) {

    const relatedImageDocuments = [];
    for (let image of images) {

        image.resource.relations = {
            depicts: image.resource.relations[ImageRelations.DEPICTS]
                .filter(includedIn(idsOfCatalogResources))
        } as any;

        if (image.resource.relations[ImageRelations.DEPICTS].length > 0) {
            relatedImageDocuments.push(image);
        }
    }
    return relatedImageDocuments;
}


function cleanDocument(document: Document) {

    delete document['_attachments'];
    delete document[Document._REV];
    delete document[Document.CREATED];
    delete document[Document.MODIFIED];
    // TODO delete all relations execpt isDepictedIn and depicts
    return document;
}