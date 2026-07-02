use sha2::{Digest, Sha256};
use uuid::Uuid;

pub fn generate_device_id() -> (String, String) {
    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_default();
    let os = std::env::consts::OS;
    let stable_raw = format!("{}|{}", hostname, os);
    let mut hasher = Sha256::new();
    hasher.update(stable_raw.as_bytes());
    let device_id = Uuid::new_v5(
        &Uuid::NAMESPACE_DNS,
        &hex::encode(hasher.finalize()).as_bytes(),
    )
    .to_string();

    let raw = format!("{}|{}|{}", hostname, os, Uuid::new_v4());
    let mut f_hasher = Sha256::new();
    f_hasher.update(raw.as_bytes());
    let fingerprint = hex::encode(f_hasher.finalize());

    (device_id, fingerprint)
}
