import {Document} from 'idai-components-2';
import {makeLines} from './parser';
import {reduce} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvParsing { // TODO make sure number typed fields get converted into number fields

    /**
     * @param content
     * @param type
     * @param sep
     * @param operationId converted into isChildOf entry if not empty
     */
    export function parse(content: string,
                          type: string,
                          sep: string,
                          operationId: string): Array<Document> {

        const rows = makeLines(content); // TODO test separation works properly
        if (rows.length < 1) return [];
        const fields = rows[0].split(sep);
        rows.shift();

        return rows.reduce((documents, row) => {

            const document = makeDocument(fields)(row.split(sep));

            (document.resource as any)['type'] = type;
            if (operationId) (document.resource as any).relations = { isChildOf: operationId };

            return documents.concat([document as any]);

        }, [] as Array<Document>);
    }


    function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

        let index = parseInt(pathSegments[0]);
        if (isNaN(index)) index = pathSegments[0];

        if (pathSegments.length < 2) {

            currentSegmentObject[index] = val;
            return;
        }

        const nextIndex = parseInt(pathSegments[1]);
        const newItem = isNaN(nextIndex) ? {} : Array(nextIndex + 1);

        if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

        pathSegments.shift();
        implodePaths(currentSegmentObject[index], pathSegments, val);
    }


    function insertFieldIntoDocument(resource: any, field: any, fieldOfRow: any) {

        if (field.includes('.')) implodePaths(resource, field.split('.'), fieldOfRow);
        else (resource as any)[field] = fieldOfRow;
    }


    function makeDocument(fields: string[]) {

        return reduce((document, fieldOfRow, i: number) => {

            if (fieldOfRow) insertFieldIntoDocument(document.resource, fields[i], fieldOfRow);
            return document;

        }, { resource: {} });
    }
}