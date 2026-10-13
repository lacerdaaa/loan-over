import { Injectable } from '@nestjs/common';

const MAX_UPCOMING_LIBERATIONS = 3;
const LOCALE = 'pt-BR';
const BRL_FORMATTER = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' });
const MONTH_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SUBJECT_TEST = 'E-mail de teste do LoanOver';
const SUBJECT_FREED = 'Dinheiro liberado nas suas dívidas';
const SUBJECT_LAST_INSTALLMENT = 'Última parcela chegando';
const HEADING_LAST_INSTALLMENT = 'Última parcela no próximo mês';
const HEADING_FREED = 'Parcelas quitadas — dinheiro liberado';
const HEADING_REPORT = 'Resumo do mês';
const HEADING_LIBERATIONS = 'Próximas liberações';

const STYLE_BODY = 'font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5;';
const STYLE_HEADING = 'font-size:16px;margin:24px 0 8px;';
const STYLE_FOOTER = 'font-size:12px;color:#6b7280;margin-top:32px;';

export interface NotificationDebt {
  name: string;
  installment_amount: number | string;
}

export interface UpcomingLiberation {
  debt_name: string;
  amount: number;
  month: number;
  year: number;
}

export interface MonthlyReportData {
  month: number;
  year: number;
  total_income: number;
  total_fixed: number;
  total_debts: number;
  total_occasional: number;
  free_balance: number;
  upcomingLiberations: UpcomingLiberation[];
}

export interface ComposeInput {
  userName: string;
  lastInstallmentNextMonth: NotificationDebt[];
  finalInstallmentThisMonth: NotificationDebt[];
  report?: MonthlyReportData;
  unsubscribeUrl: string;
}

export interface ComposedEmail {
  subject: string;
  html: string;
  text: string;
}

interface Section {
  heading: string;
  lines: string[];
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const brl = (value: number | string): string => BRL_FORMATTER.format(Number(value));
const monthLabel = (month: number, year: number): string =>
  MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
const debtLine = (d: NotificationDebt): string => `${d.name} — ${brl(d.installment_amount)}/mês`;

@Injectable()
export class NotificationComposer {
  compose(input: ComposeInput): ComposedEmail | null {
    const sections = this.buildSections(input);
    if (sections.length === 0) return null;
    return {
      subject: this.subjectFor(input),
      html: this.renderHtml(input.userName, sections, input.unsubscribeUrl),
      text: this.renderText(input.userName, sections, input.unsubscribeUrl),
    };
  }

  composeTest(input: { userName: string; unsubscribeUrl: string }): ComposedEmail {
    const sections: Section[] = [
      { heading: 'Tudo certo', lines: ['Este é um e-mail de teste das suas notificações.'] },
    ];
    return {
      subject: SUBJECT_TEST,
      html: this.renderHtml(input.userName, sections, input.unsubscribeUrl),
      text: this.renderText(input.userName, sections, input.unsubscribeUrl),
    };
  }

  private subjectFor(input: ComposeInput): string {
    if (input.report)
      return `Seu relatório de ${monthLabel(input.report.month, input.report.year)}`;
    if (input.finalInstallmentThisMonth.length > 0) return SUBJECT_FREED;
    return SUBJECT_LAST_INSTALLMENT;
  }

  private buildSections(input: ComposeInput): Section[] {
    const sections: Section[] = [];
    if (input.finalInstallmentThisMonth.length > 0) {
      sections.push(this.freedSection(input.finalInstallmentThisMonth));
    }
    if (input.lastInstallmentNextMonth.length > 0) {
      sections.push({
        heading: HEADING_LAST_INSTALLMENT,
        lines: input.lastInstallmentNextMonth.map(debtLine),
      });
    }
    if (input.report) sections.push(...this.reportSections(input.report));
    return sections;
  }

  private freedSection(debts: NotificationDebt[]): Section {
    const total = debts.reduce((sum, d) => sum + Number(d.installment_amount), 0);
    return {
      heading: HEADING_FREED,
      lines: [
        ...debts.map((d) => d.name),
        `A partir do próximo mês, ${brl(total)}/mês ficam livres.`,
      ],
    };
  }

  private reportSections(report: MonthlyReportData): Section[] {
    const summary: Section = {
      heading: HEADING_REPORT,
      lines: [
        `Renda: ${brl(report.total_income)}`,
        `Gastos fixos: ${brl(report.total_fixed)}`,
        `Parcelas de dívidas: ${brl(report.total_debts)}`,
        `Gastos ocasionais: ${brl(report.total_occasional)}`,
        `Saldo livre: ${brl(report.free_balance)}`,
      ],
    };
    const upcoming = report.upcomingLiberations.slice(0, MAX_UPCOMING_LIBERATIONS);
    if (upcoming.length === 0) return [summary];
    const liberations: Section = {
      heading: HEADING_LIBERATIONS,
      lines: upcoming.map(
        (l) => `${l.debt_name} — ${brl(l.amount)}/mês em ${monthLabel(l.month, l.year)}`,
      ),
    };
    return [summary, liberations];
  }

  private renderText(userName: string, sections: Section[], unsubscribeUrl: string): string {
    const body = sections.map((s) => [s.heading, ...s.lines.map((l) => `- ${l}`)].join('\n'));
    return [
      `Olá, ${userName}`,
      ...body,
      `Para deixar de receber estes e-mails: ${unsubscribeUrl}`,
    ].join('\n\n');
  }

  private renderHtml(userName: string, sections: Section[], unsubscribeUrl: string): string {
    const body = sections.map((s) => this.htmlSection(s)).join('');
    return (
      `<div style="${STYLE_BODY}">` +
      `<p>Olá, ${escapeHtml(userName)}</p>${body}` +
      `<p style="${STYLE_FOOTER}">Para deixar de receber estes e-mails, ` +
      `<a href="${escapeHtml(unsubscribeUrl)}">cancele a inscrição</a>.</p></div>`
    );
  }

  private htmlSection(section: Section): string {
    const items = section.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
    return `<h2 style="${STYLE_HEADING}">${section.heading}</h2><ul>${items}</ul>`;
  }
}
