def test_login_with_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        data={
            "username": "client-a@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"