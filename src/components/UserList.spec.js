import UserList from "./UserList.vue";
import { render, screen } from "@testing-library/vue";
import { setupServer } from "msw/node";
import { rest } from "msw";
import userEvent from "@testing-library/user-event";
import router from "../routes/router";
import en from "../locales/en.json";
import tr from "../locales/tr.json";
import i18n from "../locales/i18n";
import LanguageSelector from "./LanguageSelector";

const server = setupServer(
  rest.get("/api/1.0/users", (req, res, ctx) => {
    let page = Number.parseInt(req.url.searchParams.get("page"));
    let size = Number.parseInt(req.url.searchParams.get("size"));
    if (Number.isNaN(page)) {
      page = 0;
    }
    if (Number.isNaN(size)) {
      size = 5;
    }

    return res(ctx.status(200), ctx.json(getPage(page, size)));
  })
);

beforeAll(() => server.listen());

beforeEach(() => {
  server.resetHandlers();
});

afterAll(() => server.close());

const getPage = (page, size) => {
  let start = page * size;
  let end = start + size;
  let totalPages = Math.ceil(users.length / size);
  return {
    content: users.slice(start, end),
    page,
    size,
    totalPages,
  };
};

const users = [
  { id: 1, username: "user1", email: "user1@mail.com", image: null },
  { id: 2, username: "user2", email: "user2@mail.com", image: null },
  { id: 3, username: "user3", email: "user3@mail.com", image: null },
  { id: 4, username: "user4", email: "user4@mail.com", image: null },
  { id: 5, username: "user5", email: "user5@mail.com", image: null },
  { id: 6, username: "user6", email: "user6@mail.com", image: null },
  { id: 7, username: "user7", email: "user7@mail.com", image: null },
];

const setup = async () => {
  const app = {
    components: {
      UserList,
      LanguageSelector,
    },
    template: `
        <UserList />
        <LanguageSelector />
        `,
  };

  render(app, {
    global: {
      plugins: [router, i18n],
    },
  });
  await router.isReady();
};

describe("User List", () => {
  it("displays three users in list", async () => {
    await setup();
    const users = await screen.findAllByText(/user/);
    expect(users.length).toBe(3);
  });
  it("displays next page link", async () => {
    await setup();
    await screen.findByText("user1");
    const nextPageLink = screen.queryByText("next >");
    expect(nextPageLink).toBeVisible();
  });
  it("displays next page after clicking next", async () => {
    await setup();
    await screen.findByText("user1");
    const nextPageLink = screen.queryByText("next >");
    await userEvent.click(nextPageLink);
    const firstUserOnPage2 = await screen.findByText("user4");
    expect(firstUserOnPage2).toBeInTheDocument();
  });
  it("hides next page link at last page", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user7");
    expect(screen.queryByText("next >")).not.toBeVisible();
  });
  it("does not display the previous page link in first page", async () => {
    await setup();
    await screen.findByText("user1");
    expect(screen.queryByText("< previous")).not.toBeVisible();
  });

  it("displays previous page link in page 2", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    expect(screen.queryByText("< previous")).toBeVisible();
  });
  it("displays previous page after clicking previous page link", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    await userEvent.click(screen.queryByText("< previous"));
    const firstUserOnPage1 = await screen.findByText("user1");
    expect(firstUserOnPage1).toBeInTheDocument();
  });
  it("displays spinner during the api call is in progress", async () => {
    await setup();
    const spinner = screen.queryByRole("status");
    expect(spinner).toBeVisible();
  });
  it("hides spinner after api call is completed", async () => {
    await setup();
    const spinner = screen.queryByRole("status");
    await screen.findByText("user1");
    expect(spinner).not.toBeVisible();
  });
  it("displays spinner after clicking next", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    const spinner = screen.queryByRole("status");
    expect(spinner).toBeVisible();
  });
});

describe("Internationalization", () => {
  it("initially displays header and navigation links in english", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    expect(screen.queryByText(en.users)).toBeInTheDocument();
    expect(screen.queryByText(en.nextPage)).toBeInTheDocument();
    expect(screen.queryByText(en.previousPage)).toBeInTheDocument();
  });
  it("displays header and navigation links in turkish after selecting that language", async () => {
    await setup();
    await screen.findByText("user1");
    await userEvent.click(screen.queryByText("next >"));
    await screen.findByText("user4");
    const turkishLanguageSelector = screen.queryByTitle("Türkçe");
    await userEvent.click(turkishLanguageSelector);
    expect(screen.queryByText(tr.users)).toBeInTheDocument();
    expect(screen.queryByText(tr.nextPage)).toBeInTheDocument();
    expect(screen.queryByText(tr.previousPage)).toBeInTheDocument();
  });
});
