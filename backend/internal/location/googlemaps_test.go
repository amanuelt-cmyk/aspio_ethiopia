package location

import "testing"

func TestResolveCoordinatesFromGoogleURL(t *testing.T) {
	result, err := NewResolver().Resolve(t.Context(), "https://www.google.com/maps/place/Aspio/@9.012345,38.765432,17z/data=!3m1!4b1")
	if err != nil {
		t.Fatal(err)
	}
	if result.Latitude != 9.012345 || result.Longitude != 38.765432 {
		t.Fatalf("unexpected coordinates: %#v", result)
	}
}

func TestResolveCoordinatesFromQueryURL(t *testing.T) {
	result, err := NewResolver().Resolve(t.Context(), "https://maps.google.com/?q=8.9806%2C38.7895")
	if err != nil {
		t.Fatal(err)
	}
	if result.Latitude != 8.9806 || result.Longitude != 38.7895 {
		t.Fatalf("unexpected coordinates: %#v", result)
	}
}

func TestRejectsNonGoogleAndOutsideAddisLinks(t *testing.T) {
	resolver := NewResolver()
	if _, err := resolver.Resolve(t.Context(), "https://example.com/maps/@9.01,38.76,17z"); err == nil {
		t.Fatal("expected non-Google host to be rejected")
	}
	if _, err := resolver.Resolve(t.Context(), "https://google.com/maps/@59.3293,18.0686,17z"); err == nil {
		t.Fatal("expected location outside Addis to be rejected")
	}
}
