import io
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app, windows_collection

client = TestClient(app)

@pytest.fixture(autouse=True)
def mock_db():
    with patch.object(windows_collection, 'find_one') as mock_find_one, \
         patch.object(windows_collection, 'insert_one') as mock_insert_one, \
         patch.object(windows_collection, 'count_documents') as mock_count, \
         patch.object(windows_collection, 'find') as mock_find:
        yield {
            "find_one": mock_find_one,
            "insert_one": mock_insert_one,
            "count_documents": mock_count,
            "find": mock_find,
        }

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_upload_rejects_empty_file():
    file_content = b""
    response = client.post(
        "/api/windows",
        files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Archivo vacío" in response.json()["detail"]

def test_upload_and_insert(mock_db):
    mock_db["find_one"].return_value = None
    mock_db["insert_one"].return_value = MagicMock(inserted_id="123")
    
    file_content = b"fakeimagedata"
    response = client.post(
        "/api/windows/",
        files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert "_id" in body
    assert body["isDuplicate"] is False

def test_get_all(mock_db):
    mock_db["count_documents"].return_value = 1
    
    # Create a mock cursor that supports chaining
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.skip.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.__iter__.return_value = iter([{"_id": "abc", "description": "sample"}])
    
    mock_db["find"].return_value = mock_cursor
    
    response = client.get("/api/windows")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["data"]) == 1