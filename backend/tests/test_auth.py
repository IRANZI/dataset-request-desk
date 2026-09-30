def test_login_with_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "client-a@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401