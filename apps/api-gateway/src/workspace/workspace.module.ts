import { Module } from '@nestjs/common';
import { CaseController } from './case.controller';
import { CaseService } from './case.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';

@Module({
  controllers: [CaseController, SearchController, CollectionController],
  providers: [CaseService, SearchService, CollectionService],
  exports: [CaseService, SearchService],
})
export class WorkspaceModule {}
