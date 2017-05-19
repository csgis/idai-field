import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {HttpModule, Http} from '@angular/http';
import {FormsModule} from '@angular/forms';
import {Datastore, ReadDatastore} from 'idai-components-2/datastore';
import {IdaiMessagesModule, Messages, MD} from 'idai-components-2/messages';
import {IdaiDocumentsModule, DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Validator, PersistenceManager} from 'idai-components-2/persist';
import {IdaiFieldValidator} from './model/idai-field-validator';
import {ConfigLoader} from 'idai-components-2/configuration';
import {routing, appRoutingProviders} from './app.routing';
import {IdaiFieldDatastore} from './datastore/idai-field-datastore';
import {M} from './m';
import {AppComponent} from './app.component';
import {ResourcesModule} from './resources/resources.module';
import {ImportComponent} from './import/import.component';
import {ExportComponent} from './export/export.component';
import {Importer} from './import/importer';
import {Exporter} from './export/exporter';
import {RelationsCompleter} from './import/relations-completer';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Imagestore} from './imagestore/imagestore';
import {ReadImagestore} from './imagestore/read-imagestore';
import {FileSystemImagestore} from './imagestore/file-system-imagestore';
import {ImagesModule} from './images/images.module';
import {NavbarComponent} from './navbar.component';
import {ListModule} from './list/list.module';
import {CachedDatastore} from './datastore/cached-datastore';
import {BlobMaker} from './imagestore/blob-maker';
import {Converter} from './imagestore/converter';
import {IdaiWidgetsModule} from 'idai-components-2/widgets';
import {SettingsModule} from './settings/settings.module';
import {AppConfigurator} from 'idai-components-2/idai-field-model';
import {SettingsService} from './settings/settings-service';
import {PouchdbServerDatastore} from './datastore/pouchdb-server-datastore';
import {TaskbarComponent} from "./taskbar.component";
import {WidgetsModule} from "./widgets/widgets.module";

const CONFIG = require('electron').remote.getGlobal('config');

@NgModule({
    imports: [
        ImagesModule,
        ResourcesModule,
        ListModule,
        SettingsModule,
        BrowserModule,
        FormsModule,
        HttpModule,
        NgbModule.forRoot(),
        IdaiDocumentsModule,
        IdaiMessagesModule,
        routing,
        IdaiWidgetsModule,
        WidgetsModule
    ],
    declarations: [
        AppComponent,
        NavbarComponent,
        TaskbarComponent,
        ImportComponent,
        ExportComponent
    ],
    providers: [
        SettingsService,
        {
            provide: FileSystemImagestore,
            useFactory: function(http: Http,blobMaker: BlobMaker): FileSystemImagestore {

                let path;
                if (CONFIG['imagestorepath']) {
                    path = CONFIG['imagestorepath'];
                } else {
                    const app = (<any>window).require('electron').remote.app;
                    path = app.getPath('appData') + '/' + app.getName() + '/imagestore/';
                }
                return new FileSystemImagestore(new Converter(), blobMaker, path);

            },
            deps: [Http, BlobMaker]
        },
        { provide: Imagestore, useExisting: FileSystemImagestore },
        { provide: ReadImagestore, useExisting: Imagestore },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        {
            provide: Datastore,
            useFactory: function(configLoader: ConfigLoader) : Datastore {
                return new CachedDatastore(new PouchdbServerDatastore(configLoader));
            },
            deps: [ConfigLoader]
        },
        { provide: ReadDatastore, useExisting: Datastore },
        { provide: IdaiFieldDatastore, useExisting: Datastore },
        Messages,
        BlobMaker,
        { provide: 'app.config', useValue: CONFIG },
        ConfigLoader,
        PersistenceManager,
        AppConfigurator,
        DocumentEditChangeMonitor,
        {
            provide: Validator,
            useFactory: function(configLoader: ConfigLoader, datastore: IdaiFieldDatastore) {
                return new IdaiFieldValidator(configLoader, datastore);
            },
            deps: [ConfigLoader, ReadDatastore]
        },
        { provide: MD, useClass: M},
        Importer,
        Exporter,
        RelationsCompleter,
        appRoutingProviders
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule { }