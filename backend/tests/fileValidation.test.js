const { registerFileSchema, uploadUrlSchema } = require('../src/modules/files/file.validation');

describe('file validation - stage 7 billing period', () => {
  const baseRegisterPayload = {
    originalName: 'report.pdf',
    storagePath: 'tenant/project/report.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    mediaType: 'document',
    stage: 7,
    category: 'progress-report',
    projectId: '507f191e810c19729de860ea',
  };

  it('rejects stage 7 progress report without billing period', () => {
    const { error } = registerFileSchema.validate(baseRegisterPayload);
    expect(error).toBeTruthy();
  });

  it('accepts stage 7 progress report with billing period', () => {
    const { error } = registerFileSchema.validate({
      ...baseRegisterPayload,
      billingPeriod: '2026-03',
    });
    expect(error).toBeUndefined();
  });

  it('does not require billing period for non-stage7 document', () => {
    const { error } = registerFileSchema.validate({
      ...baseRegisterPayload,
      stage: 4,
      category: 'tender-document',
      billingPeriod: '',
    });
    expect(error).toBeUndefined();
  });

  it('requires billing period on upload-url request for stage 7 payment certificate', () => {
    const { error } = uploadUrlSchema.validate({
      projectId: '507f191e810c19729de860ea',
      stage: 7,
      category: 'payment-certificate',
      fileName: 'pc-march.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
    });
    expect(error).toBeTruthy();
  });
});
