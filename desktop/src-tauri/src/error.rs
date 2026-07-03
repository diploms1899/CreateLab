use serde::Serialize;

#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Auth error: {0}")]
    Auth(String),
    #[error("Network error: {0}")]
    Network(String),
    #[error("Workspace error: {0}")]
    Workspace(String),
    #[error("Arduino error: {0}")]
    Arduino(String),
    #[error("Sync error: {0}")]
    Sync(String),
    #[error("Device error: {0}")]
    Device(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_str())
    }
}
