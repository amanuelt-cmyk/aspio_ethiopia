package security

import "testing"

func TestPasswordRoundTrip(t *testing.T) {
	hash, err := HashPassword("a-long-test-password")
	if err != nil {
		t.Fatal(err)
	}
	if !VerifyPassword(hash, "a-long-test-password") {
		t.Fatal("correct password was rejected")
	}
	if VerifyPassword(hash, "not-the-password") {
		t.Fatal("incorrect password was accepted")
	}
}

func TestSessionToken(t *testing.T) {
	plain, hash, err := NewSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if plain == "" || hash == "" || hash != HashSessionToken(plain) {
		t.Fatal("session token was not generated consistently")
	}
}
