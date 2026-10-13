import {
  ComposeInput,
  MonthlyReportData,
  NotificationComposer,
  NotificationDebt,
} from './notification.composer';

const UNSUBSCRIBE_URL = 'https://api.example.com/notifications/unsubscribe?token=abc';

const debt = (name: string, amount: number | string): NotificationDebt => ({
  name,
  installment_amount: amount,
});

const report = (overrides: Partial<MonthlyReportData> = {}): MonthlyReportData => ({
  month: 3,
  year: 2027,
  total_income: 5000,
  total_fixed: 1500,
  total_debts: 800,
  total_occasional: 200,
  free_balance: 2500,
  upcomingLiberations: [],
  ...overrides,
});

const input = (overrides: Partial<ComposeInput> = {}): ComposeInput => ({
  userName: 'Ana',
  lastInstallmentNextMonth: [],
  finalInstallmentThisMonth: [],
  unsubscribeUrl: UNSUBSCRIBE_URL,
  ...overrides,
});

describe('NotificationComposer', () => {
  const composer = new NotificationComposer();

  describe('when there is nothing to say', () => {
    it('returns null', () => {
      expect(composer.compose(input())).toBeNull();
    });
  });

  describe('when a debt has its last installment next month', () => {
    const email = composer.compose(input({ lastInstallmentNextMonth: [debt('Notebook', 350.5)] }))!;

    it('announces the upcoming last installment in the subject', () => {
      expect(email.subject).toBe('Última parcela chegando');
    });

    it('names the debt and formats the amount in BRL in both bodies', () => {
      expect(email.html).toContain('Notebook');
      expect(email.html).toContain('350,50');
      expect(email.text).toContain('Notebook');
      expect(email.text).toContain('350,50');
    });

    it('greets the user and links the unsubscribe URL', () => {
      expect(email.html).toContain('Olá, Ana');
      expect(email.html).toContain(`href="${UNSUBSCRIBE_URL}"`);
      expect(email.text).toContain(UNSUBSCRIBE_URL);
    });
  });

  describe('when a debt had its final installment this month', () => {
    const email = composer.compose(
      input({ finalInstallmentThisMonth: [debt('Carro', '1000'), debt('Loja', 200.25)] }),
    )!;

    it('announces freed money in the subject', () => {
      expect(email.subject).toBe('Dinheiro liberado nas suas dívidas');
    });

    it('lists each debt and the total freed per month', () => {
      expect(email.text).toContain('Carro');
      expect(email.text).toContain('Loja');
      expect(email.text).toContain('1.200,25');
    });
  });

  describe('when both kinds of alert apply', () => {
    it('uses the freed-money subject and includes both sections', () => {
      const email = composer.compose(
        input({
          lastInstallmentNextMonth: [debt('A', 10)],
          finalInstallmentThisMonth: [debt('B', 20)],
        }),
      )!;

      expect(email.subject).toBe('Dinheiro liberado nas suas dívidas');
      expect(email.text).toContain('A');
      expect(email.text).toContain('B');
    });
  });

  describe('when a monthly report is attached', () => {
    it('titles the email with the report month in Portuguese', () => {
      const email = composer.compose(input({ report: report() }))!;

      expect(email.subject).toBe('Seu relatório de março de 2027');
    });

    it('shows the snapshot totals', () => {
      const email = composer.compose(input({ report: report() }))!;

      expect(email.text).toContain('5.000,00');
      expect(email.text).toContain('1.500,00');
      expect(email.text).toContain('800,00');
      expect(email.text).toContain('200,00');
      expect(email.text).toContain('2.500,00');
    });

    it('lists at most three upcoming liberations', () => {
      const liberations = ['D1', 'D2', 'D3', 'D4'].map((name, index) => ({
        debt_name: name,
        amount: 100,
        month: index + 4,
        year: 2027,
      }));

      const email = composer.compose(
        input({ report: report({ upcomingLiberations: liberations }) }),
      )!;

      expect(email.text).toContain('D1');
      expect(email.text).toContain('D3');
      expect(email.text).not.toContain('D4');
      expect(email.html).toContain('abril de 2027');
    });

    it('omits the liberations section when none are coming', () => {
      const email = composer.compose(input({ report: report() }))!;

      expect(email.text).not.toContain('Próximas liberações');
    });

    it('combines alerts and report in a single email', () => {
      const email = composer.compose(
        input({ report: report(), lastInstallmentNextMonth: [debt('Notebook', 10)] }),
      )!;

      expect(email.subject).toBe('Seu relatório de março de 2027');
      expect(email.text).toContain('Notebook');
    });
  });

  describe('when names contain HTML', () => {
    it('escapes user-provided names in the HTML body only', () => {
      const email = composer.compose(
        input({
          userName: '<b>Ana</b>',
          lastInstallmentNextMonth: [debt(`<script>alert("x")</script> & 'co'`, 10)],
        }),
      )!;

      expect(email.html).not.toContain('<script>');
      expect(email.html).not.toContain('<b>Ana</b>');
      expect(email.html).toContain(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;co&#39;',
      );
      expect(email.text).toContain('<script>');
    });
  });

  describe('composeTest', () => {
    it('builds a test email addressed to the user with the unsubscribe link', () => {
      const email = composer.composeTest({ userName: 'Ana', unsubscribeUrl: UNSUBSCRIBE_URL });

      expect(email.subject).toBe('E-mail de teste do LoanOver');
      expect(email.html).toContain('Olá, Ana');
      expect(email.text).toContain(UNSUBSCRIBE_URL);
    });
  });
});
