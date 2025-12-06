import { EntitySchema } from 'typeorm';
import { TemporaryPasswordsEntity } from '../entities/temporary-passwords.entity';

export const TemporaryPasswordsSchema =
  new EntitySchema<TemporaryPasswordsEntity>({
    name: 'TemporaryPasswords',
    tableName: 'temporary_passwords',
    columns: {
      id: { type: 'int', primary: true, generated: true },
      account_id: { type: 'bigint' },
      temp_password_hash: { type: 'varchar', length: 255 },
      expires_at: { type: 'timestamp' },
      used_at: { type: 'timestamp', nullable: true },
      must_change_password: { type: 'boolean', default: true },
      created_at: { type: 'timestamp', createDate: true },
    },
    indices: [
      {
        name: 'idx_temporary_passwords_account_id',
        columns: ['account_id'],
      },
      {
        name: 'idx_temporary_passwords_expires_at',
        columns: ['expires_at'],
      },
    ],
  });
