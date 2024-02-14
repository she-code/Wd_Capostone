let baseURL = "http://localhost:5001";

const clearSignUpFields = (cy) => {
  cy.get('input[name="firstName"]').clear();
  cy.get('input[name="lastName"]').clear();
  cy.get('input[name="email"]').clear();
  cy.get('input[name="password"]').clear();
};

const checkSignupFieldsExist = (cy) => {
  cy.get('input[name="firstName"]').should("exist");
  cy.get('input[name="lastName"]').should("exist");
  cy.get('input[name="email"]').should("exist");
  cy.get('input[name="password"]').should("exist");
  cy.get('button[type="submit"]').should("exist");
};

const setSignupFieldValuesWithOutFname = (cy) => {
  cy.get('input[name="lastName"]').type("Haile");
  cy.get('input[name="email"]').type("fre@gmail.com");
  cy.get('input[name="password"]').type("12345678");
};
const setSignupFieldValues = (cy) => {
  cy.get('input[name="firstName"]').type("Fre");
  cy.get('input[name="lastName"]').type("Haile");
  cy.get('input[name="email"]').type("testSlack@gmail.com");
  cy.get('input[name="password"]').type("12345678");
};
const setSignupFieldValuesInvalidEmail = (cy) => {
  cy.get('input[name="firstName"]').type("Haile");
  cy.get('input[name="lastName"]').type("Haile");
  cy.get('input[name="email"]').type("invalid-email");
  cy.get('input[name="password"]').type("12345678");
};

const checkSignInFieldsExist = (cy) => {
  cy.get('input[name="email"]').should("exist");
  cy.get('input[name="password"]').should("exist");
  cy.get('button[type="submit"]').should("exist");
};
const clearSignInFields = (cy) => {
  cy.get('input[name="email"]').clear();
  cy.get('input[name="password"]').clear();
};
const setSignInFieldsInvalidCredentials = (cy) => {
  cy.get('input[name="email"]').type("test@g.com");
  cy.get('input[name="password"]').type("12345678");
};
const setSignInFields = (cy) => {
  cy.get('input[name="email"]').type("testSlack@gmail.com");
  cy.get('input[name="password"]').type("12345678");
};
const clearCreateElectionFields = (cy) => {
  cy.get('input[name="title"]').clear();
  cy.get('input[name="url"]').clear();
};
describe("Wd capstone integration test, Sign up page test", () => {
  beforeEach(() => {
    cy.visit(`${baseURL}/signup`);
  });
  it("Sign Up Page should exist", () => {
    cy.url().should("include", "/signup");
  });
  it("Should contain all required fields and submit button", () => {
    checkSignupFieldsExist(cy);
  });
  it("Should not submit with empty first name, last name, email or password", () => {
    clearSignUpFields(cy);
    setSignupFieldValuesWithOutFname(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/signup");
    });
  });
  it("Should not submit with invalid email", () => {
    clearSignUpFields(cy);
    setSignupFieldValuesInvalidEmail(cy);
    cy.get('button[type="submit"]').click();
    cy.get('input[name="email"]:invalid').should("exist");
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/signup");
    });
  });
  it("Should register with valid credentials", () => {
    clearSignUpFields(cy);
    setSignupFieldValues(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections");
    });
  });
});

describe("Wd capstone integration test, Sign In page test", () => {
  beforeEach(() => {
    cy.visit(`${baseURL}/login`);
  });
  it("Sign In Page should exist", () => {
    cy.url().should("include", "/login");
  });
  it("Should contain input fields with the name email, password and submit button", () => {
    checkSignInFieldsExist(cy);
  });
  it("Should not submit with empty email or password", () => {
    clearSignInFields(cy);

    cy.get('input[name="password"]').type("12345678");

    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });
  it("Should not submit with invalid email", () => {
    clearSignInFields(cy);
    cy.get('input[name="email"]').type("invalid-email");
    cy.get('input[name="password"]').type("12345678");
    cy.get('button[type="submit"]').click();
    cy.get('input[name="email"]:invalid').should("exist");
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });
  it("Should not submit with invalid credentials", () => {
    clearSignInFields(cy);
    setSignInFieldsInvalidCredentials(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/login");
    });
  });
  it("Should login with valid credentials and redirect to /elections", () => {
    setSignInFields(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections");
    });
  });
});

describe("Wd capstone integration test, Create Election Page test", () => {
  beforeEach(() => {
    cy.visit(`${baseURL}/login`);
    setSignInFields(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections");
    });
    cy.contains("Create new election").click();
    cy.url().should("include", `${baseURL}/elections/createElections/new`);
  });
  it("Create Election Page should exist", () => {
    cy.url().should("include", `${baseURL}/elections/createElections/new`);
  });
  it("Input fields with the name title and url should exit", () => {
    cy.get('input[name="title"]').should("exist");
    cy.get('input[name="url"]').should("exist");
  });
  it("Should not submit with empty title or custom string", () => {
    clearCreateElectionFields(cy);
    cy.get('input[name="url"]').type("custom");
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections/createElections/new");
    });
  });
  it("Should Create Election and redirect to election details page", () => {
    clearCreateElectionFields(cy);
    cy.get('input[name="title"]').type("Integration-4");
    cy.get('input[name="url"]').type("integration-4");
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.url().should("match", /\/elections\/\d+/); // Matches /todo/ followed by one or more digits

    cy.url().then((url) => {
      const dynamicId = url.match(/\/elections\/(\d+)/)[1];
      cy.get(`.election-title`).should("contain.text", "Integration-4");
    });
  });
  it("Should Create an Election with unique custom string | url", () => {
    clearCreateElectionFields(cy);
    cy.get('input[name="title"]').type("Integration-4");
    cy.get('input[name="url"]').type(`${"integration-4"}`);
    cy.get('button[type="submit"]').click();
    cy.wait(500);

    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections/createElections/new");
    });
  });
});

describe("Wd capstone integration test, Elections Page test", () => {
  beforeEach(() => {
    cy.visit(`${baseURL}/login`);
    setSignInFields(cy);
    cy.get('button[type="submit"]').click();
    cy.wait(500);
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq("/elections");
    });
  });
  it("Election Page should exist", () => {
    cy.url().should("include", `${baseURL}/elections`);
  });

  it("Should contain edit and delete icons ", () => {
    cy.get("#edit-icon");
    cy.get("#delete-icon");
  });
  it("Should contain Sign Out button in the dropdown ", () => {
    cy.contains("Sign out");
  });
});
