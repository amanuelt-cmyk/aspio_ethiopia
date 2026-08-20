package httpapi

import "testing"

func TestHashIPPseudonymizesWithDeploymentSecret(t *testing.T) {
	first := hashIP("203.0.113.10", "first-secret-value")
	second := hashIP("203.0.113.10", "second-secret-value")
	if first == "" || first == second {
		t.Fatalf("hashIP() must produce a non-empty deployment-specific digest")
	}
	if first != hashIP("203.0.113.10", "first-secret-value") {
		t.Fatal("hashIP() must be stable for the same address and secret")
	}
}
