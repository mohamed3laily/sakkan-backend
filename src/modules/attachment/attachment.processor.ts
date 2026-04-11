import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ATTACHMENT_JOBS, QUEUES } from 'src/common/queues/queue.constants';
import { AttachmentRepository } from './attachment.repo';
import { S3Service } from 'src/modules/storage/s3.service';

@Processor(QUEUES.ATTACHMENT)
export class AttachmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AttachmentProcessor.name);

  constructor(
    private readonly repo: AttachmentRepository,
    private readonly s3: S3Service,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case ATTACHMENT_JOBS.CLEANUP_ORPHANS:
        return this.handleCleanupOrphans();
    }
  }

  private async handleCleanupOrphans() {
    const orphans = await this.repo.findOrphans();

    if (orphans.length === 0) return;

    const results = await Promise.allSettled(orphans.map((a) => this.s3.deleteByKey(a.key)));

    const succeededIds = orphans
      .filter((_, i) => results[i].status === 'fulfilled')
      .map((a) => a.id);

    if (succeededIds.length > 0) {
      await this.repo.deleteByIds(succeededIds);
    }
  }
}
