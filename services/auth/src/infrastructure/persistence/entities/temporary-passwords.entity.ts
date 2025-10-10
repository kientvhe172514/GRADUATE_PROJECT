export class TemporaryPasswordsEntity {
  id?: number;
  account_id: number;
  temp_password_hash: string;
  
  expires_at: Date;
  used_at?: Date;
  must_change_password: boolean;
  
  created_at?: Date;
}
